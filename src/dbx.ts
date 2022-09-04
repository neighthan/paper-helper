import { Dropbox } from 'dropbox'
import { Entry } from "./entries/entry"
import {logger} from "./logger"
import {mergeTexts} from "./utils"
import {EntryTypes} from "@/entries/entries"
import Settings from "@/backend/settings"
import { exportFiles } from './backend/files'

const DROPBOX_PATH = "/paper-helper-db.json"
const DB: any = 0

type HasId = {
  id: string
}

type Syncable = {
  lastSyncTime: number,
  lastModifiedTime: number,
}

type Table<T> = {
  tableName: string,
  rows: T[]
}


/**
 * The tables may have different types; T should be the type of the entries in the table
 * with `tableName === name`.
 */
function extractTable<T extends HasId>(tables: Table<any>[], name: string) {
  const data: Map<string, T> = new Map()
  for (let table of tables) {
    if (table.tableName !== name) continue
    for (let datum of <T[]> table.rows) {
      data.set(datum.id, datum)
    }
  }
  return data
}

/**
 *
 * @param localData
 * @param dbxData
 * @param mergeCallback The default merge strategy is to keep the newer entry. If this
 *   entry should be modified to include some information from the older entry, use
 *   this callback to do so.
 */
async function mergeData<T extends Syncable & HasId>(
  localData: Map<string, T>,
  dbxData: Map<string, T>,
  mergeCallback?: (newerDatum: T, olderDatum: T) => void,
) {
  const deletedEntries: Map<string, number> = new Map()

  const localIdsModified: string[] = []
  const localIdsNotModified: string[] = []
  for (let datum of localData.values()) {
    // if a datum has never been synced to dbx, lastSyncTime is -1, so
    // lastModifiedTime will be greater
    if (datum.lastModifiedTime > datum.lastSyncTime) {
      localIdsModified.push(datum.id)
    } else {
      localIdsNotModified.push(datum.id)
    }
  }
  // these data were synced to dbx but are missing from it now, so they must have
  // been deleted by another device. Since they haven't been modified locally,
  // just sync the deletion.
  const localOnlyIdsNotModified = localIdsNotModified.filter(id => !dbxData.has(id))

  const mergeIds: string[] = []
  const addData: T[] = []
  const mergedData: T[] = []
  for (let [id, dbxDatum] of dbxData) {
    if (localData.has(id)) {
      const localDatum = localData.get(id)!
      if (localDatum.lastSyncTime >= localDatum.lastModifiedTime) {
        // local hasn't been modified, so keep dbx version, if different
        if (dbxDatum.lastSyncTime > localDatum.lastSyncTime) {
          mergedData.push(dbxDatum)
        }
      } else if (dbxDatum.lastSyncTime == localDatum.lastSyncTime) {
        // dbx hasn't been modified, so keep local (by doing nothing)
      } else {
        // local and dbx have both been modified
        logger.debug("Local:", localDatum)
        logger.debug("Dbx:", dbxDatum)
        mergeIds.push(dbxDatum.id)
      }
    } else { // dbx only; add to local if not deleted (and not modified since)
      if (deletedEntries.has(id)) {
        const lastSyncTime = deletedEntries.get(id)
        if (lastSyncTime === undefined || dbxDatum.lastModifiedTime > lastSyncTime) {
          addData.push(dbxDatum)
        }
      } else {
        addData.push(dbxDatum)
      }
    }
  }

  for (let id of mergeIds) {
    const dbxDatum = dbxData.get(id)
    const localDatum = localData.get(id)
    if (dbxDatum === undefined || localDatum === undefined) continue
    let newerDatum: T
    let olderDatum: T
    if (dbxDatum.lastModifiedTime > localDatum.lastModifiedTime) {
      newerDatum = dbxDatum
      olderDatum = localDatum
    } else {
      newerDatum = localDatum
      olderDatum = dbxDatum
    }
    if (mergeCallback) mergeCallback(newerDatum, olderDatum)
    mergedData.push(newerDatum)
  }
  return {localOnlyIdsNotModified, addData, mergedData}
}

async function updateDBFromDropbox<T extends Syncable & HasId>(
  jsonTables: Table<any>[],
  dexieTable: any, //Dexie.Table<T, any>,
  mergeCallback?: (newerDatum: T, olderDatum: T) => void,
) {
  const dbxData = extractTable<T>(jsonTables, dexieTable.name)
  const localData: Map<string, T> = new Map()
  for (let datum of await dexieTable.toArray()) {
    localData.set(datum.id, datum)
  }
  const {localOnlyIdsNotModified, addData, mergedData} = await mergeData(localData, dbxData, mergeCallback)

  await Promise.all([
    dexieTable.bulkDelete(localOnlyIdsNotModified),
    dexieTable.bulkAdd(addData),
    dexieTable.bulkPut(mergedData),
  ])

  const nDeleted = localOnlyIdsNotModified.length
  const nAdded = addData.length
  const nMerged = mergedData.length
  return `Synced ${dexieTable.name}. # Added: ${nAdded}; # Deleted: ${nDeleted}; # Merged: ${nMerged}`
}

// entryTables: Dexie.Table<Entry, string>[]
async function syncDropbox(entryTables: any, promptForToken: boolean=true) {
  const startTime = Date.now()
  if (!Settings.syncDropbox) {
    console.log("Dropbox syncing is disabled; toggle in settings.")
    return []
  }
  if (!Settings.dropboxToken) {
    // TODO: make this nicer
    if (!promptForToken) return ["No saved Dropbox token."]
    let token =  prompt("Enter your dropbox token")
    if (!token) {
      return ["No Dropbox token given."]
    }
    Settings.dropboxToken = token
  }
  const dbx = new Dropbox({accessToken: Settings.dropboxToken})

  const msgs: string[] = []
  let response
  try {
    response = await dbx.filesDownload({path: DROPBOX_PATH})
  } catch (error) {
    console.error("Error while trying to download from Dropbox:")
    console.error(error)
    await _dbUpload(entryTables)
    return ["No data found on Dropbox; uploaded local data."]
  }
  let dbxJsonBlob = (<Blob> (<any> response.result).fileBlob)
  const json = JSON.parse(await dbxJsonBlob.text())
  const tables = json.data.data

  const entryMergeCallback = (newEntry: Entry, oldEntry: Entry) => {
    if (oldEntry.content !== newEntry.content) {
      newEntry.tags.push("merge-conflict")
      newEntry.content = mergeTexts(newEntry.content, oldEntry.content, "!~")
    }
  }
  msgs.push(await updateDBFromDropbox(tables, DB.savedQueries))

  for (const entryTable of entryTables) {
    // all entries have IDs; check if the current Entry subtype is also syncable (so that
    // the call to updateDBFromDropbox will work and to show that syncing is desired)
    const entry = await entryTable.toCollection().first()
    if (entry === undefined) {
      msgs.push(`No entries to sync for table ${entryTable.name}.`)
      continue
    }
    if (entry.lastSyncTime === undefined) {
      msgs.push(`Entries from table ${entryTable.name} have no lastSyncTime; skipping.`)
      continue
    }
    msgs.push(await updateDBFromDropbox(tables, <any> entryTable, <any> entryMergeCallback))
  }
  await _dbUpload(entryTables)
  await DB.deletedEntries.clear()
  console.log(`Syncing took ${(Date.now() - startTime) / 1000} seconds.`)
  return msgs
}

// only call this from syncDropbox!
// entryTables: Dexie.Table<Entry, string>[]
async function _dbUpload(entryTables: any) {
  // only update the sync time for entries which have been modified
  const syncTime = Date.now()
  for (const entryTable of entryTables) {
    // TODO!!
    await entryTable.toCollection().modify((entry: any) => {
      if (entry.lastModifiedTime > <number> entry.lastSyncTime) {
        entry.lastSyncTime = syncTime
      }
    })
  }
  const jsonBlob = await exportFiles()
  const jsonStr = await jsonBlob.text()
  const dbx = new Dropbox({accessToken: Settings.dropboxToken})
  dbx.filesUpload({
    path: DROPBOX_PATH,
    contents: new File([jsonStr], "db.json", {type: "application/json"}),
    mode: {".tag": "overwrite"},
  }).then(() => {
    Settings.lastSyncTime = Date.now()
  }).catch((error) => {
    console.error("Error uploading to Dropbox!")
    console.error(error)
  })
}

async function syncAllDropbox(promptForToken: boolean=true) {
  return await syncDropbox(Object.values(EntryTypes).map(t => t.ctor.name), promptForToken)
}

export {syncDropbox, syncAllDropbox}

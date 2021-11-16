import { Dropbox } from 'dropbox'
import {DeletedEntry, Meta, exportDB} from "./db"
import {DB, getMeta} from "./db"
import { Entry } from "./entries/entry"
import {logger} from "./logger"
import {mergeTexts} from "./utils"

const DROPBOX_PATH = "/paper-helper-db.json"

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
 * @param deletedEntriesArr
 * @param mergeCallback The default merge strategy is to keep the newer entry. If this
 *   entry should be modified to include some information from the older entry, use
 *   this callback to do so.
 */
async function mergeData<T extends Syncable & HasId>(
  localData: Map<string, T>,
  dbxData: Map<string, T>,
  deletedEntriesArr: DeletedEntry[],
  mergeCallback?: (newerDatum: T, olderDatum: T) => void,
) {
  const deletedEntries: Map<string, number> = new Map()
  for (let deletedEntry of deletedEntriesArr) {
    deletedEntries.set(deletedEntry.id, deletedEntry.lastSyncTime)
  }

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
      if (localDatum.lastSyncTime == localDatum.lastModifiedTime) {
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
  dexieTable: Dexie.Table<T, any>,
  mergeCallback?: (newerDatum: T, olderDatum: T) => void,
) {
  const dbxData = extractTable<T>(jsonTables, dexieTable.name)
  const localData: Map<string, T> = new Map()
  for (let datum of await dexieTable.toArray()) {
    localData.set(datum.id, datum)
  }
  const {localOnlyIdsNotModified, addData, mergedData} = await mergeData(localData, dbxData, await DB.deletedEntries.toArray(), mergeCallback)

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

async function syncDropbox(entryTable: Dexie.Table<Entry, string>, promptForToken: boolean=true) {
  const startTime = Date.now()
  // all entries have IDs; check if the current Entry subtype is also syncable (so that
  // the call to updateDBFromDropbox will work and to show that syncing is desired)
  const entry = await entryTable.toCollection().first()
  if (entry === undefined) {
    console.log("No entries to sync.")
    return
  }
  if (entry.lastSyncTime === undefined) {
    console.log(
      `Entries from table ${entryTable.name} have no lastSyncTime; skipping.`
    )
    return
  }
  const meta = await getMeta(DB)
  if (!meta.dropboxToken) {
    // TODO: make this nicer
    if (!promptForToken) return
    let token =  prompt("Enter your dropbox token")
    if (!token) {
      return
    }
    meta.dropboxToken = token
  }
  const dbx = new Dropbox({accessToken: meta.dropboxToken})

  let dbxSnackbarMsg: string
  try {
    let response = await dbx.filesDownload({path: DROPBOX_PATH})
    let dbxJsonBlob = (<Blob> (<any> response.result).fileBlob)
    const json = JSON.parse(await dbxJsonBlob.text())
    const tables = json.data.data

    const entryMergeCallback = (newEntry: Entry, oldEntry: Entry) => {
      if (oldEntry.notes !== newEntry.notes) {
        newEntry.tags.push("merge-conflict")
        newEntry.notes = mergeTexts(newEntry.notes, oldEntry.notes, "!~")
        newEntry.lastModifiedTime = Date.now()
      }
    }
    // TODO: when snackbar goes away, show a new snackbar with this message
    const querySnackbarMsg = await updateDBFromDropbox(tables, DB.savedQueries)
    dbxSnackbarMsg = await updateDBFromDropbox(tables, <any> entryTable, <any> entryMergeCallback)

    await _dbUpload(entryTable, meta)
    await DB.deletedEntries.clear()
  } catch (error) {
    console.error("No file found.")
    console.error(error)
    await _dbUpload(entryTable, meta)
    dbxSnackbarMsg = "No data found on Dropbox; uploaded local data."
  }
  console.log(`Syncing took ${(Date.now() - startTime) / 1000} seconds.`)
  // this.showDbxSnackbar = true
  return dbxSnackbarMsg
}

// only call this from syncDropbox!
async function _dbUpload(entryTable: Dexie.Table<Entry, string>, meta: Meta) {
  // only update the sync time for entries which have been modified
  const syncTime = Date.now()
  try {
    await entryTable.toCollection().modify(entry => {
      if (entry.lastModifiedTime > <number> entry.lastSyncTime) {
        entry.lastSyncTime = syncTime
      }
    })
  } catch (error) {
    console.error(error)
  }
  const jsonBlob = await exportDB(DB)
  const jsonStr = await jsonBlob.text()
  const dbx = new Dropbox({accessToken: meta.dropboxToken})
  dbx.filesUpload({
    path: DROPBOX_PATH,
    contents: new File([jsonStr], "db.json", {type: "application/json"}),
    mode: {".tag": "overwrite"},
  }).then((response) => {
    meta.lastSyncTime = Date.now()
    console.log("Finished uploading.")
    console.log(response)
  }).catch((error) => {
    console.error("Error uploading!")
    console.error(error)
  })
}

export {syncDropbox}

import {DeletedEntry} from "./db"
import {PaperData} from "./paper_types"
import {mergeTexts} from "./utils"
import {DB} from "./db"

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

export {updateDBFromDropbox}

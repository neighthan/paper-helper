import Dexie from "dexie"
import {exportDB as _exportDB} from "dexie-export-import"
import {PaperData} from "@/entries/papers/paper"
import {LogLevel} from "@/logger"
import {ToDo} from "@/entries/todos/todos"

class Meta {
  id: number
  protected _tags: string[]
  protected _dropboxToken: string
  protected _redditUserAgent: string
  protected _redditClientId: string
  protected _redditClientSecret: string
  protected _redditUsername: string
  protected _lastSyncTime: number
  protected _syncTimeThreshHours: number
  protected _logLevel: LogLevel

  constructor(
    id = 0,
    tags: string[] = [],
    dropboxToken = "",
    redditUserAgent = "",
    redditClientId = "",
    redditClientSecret = "",
    redditUsername = "",
    lastSyncTime = -1,
    syncTimeThreshHours = 24,
    logLevel: LogLevel = "debug",
  ) {
    this.id = id
    this._tags = tags
    this._dropboxToken = dropboxToken
    this._redditUserAgent = redditUserAgent
    this._redditClientId = redditClientId
    this._redditClientSecret = redditClientSecret
    this._redditUsername = redditUsername
    this._lastSyncTime = lastSyncTime
    this._syncTimeThreshHours = syncTimeThreshHours
    this._logLevel = logLevel
  }

  // dexie didn't like using a getter for id, but we don't want a setter anyway, so
  // it's not a problem (just can't make it readonly)
  get tags() {
    return this._tags
  }
  get dropboxToken() {
    return this._dropboxToken
  }
  get redditInfo() {
    return {
      userAgent: this._redditUserAgent,
      clientId: this._redditClientId,
      clientSecret: this._redditClientSecret,
      username: this._redditUsername,
    }
  }
  get lastSyncTime() {
    return this._lastSyncTime
  }
  get syncTimeThreshHours() {
    return this._syncTimeThreshHours
  }
  get logLevel() {
    return this._logLevel
  }
  set tags(tags) {
    this._tags = tags
    this._updateDb()
  }
  set dropboxToken(dropboxToken) {
    this._dropboxToken = dropboxToken
    this._updateDb()
  }
  set redditInfo(data) {
    this._redditUserAgent = data.userAgent
    this._redditClientId = data.clientId
    this._redditClientSecret = data.clientSecret
    this._redditUsername = data.username
    this._updateDb()
  }
  set lastSyncTime(lastSyncTime: number) {
    this._lastSyncTime = lastSyncTime
    this._updateDb()
  }
  set syncTimeThreshHours(syncTimeThreshHours: number) {
    this._syncTimeThreshHours = syncTimeThreshHours
    this._updateDb()
  }
  set logLevel(logLevel: LogLevel) {
    this._logLevel = logLevel
    this._updateDb()
  }
  _updateDb() {
    DB.meta.update(this.id, this)
  }
}

type Img = {
  id: string
  dataUrl: string
}

type SavedQuery = {
  id: string,
  name: string,
  searchString: string,
  tags: string[],
  timeAdded: number,
  lastSyncTime: number,
  lastModifiedTime: number,
  entryType: string,
}

type DeletedEntry = {
  id: string,
  lastSyncTime: number,
}

// WARNING - mapToClass doesn't actually call the class constructor, so default
// fields that don't already exist on an entry won't be added. See
// https://dexie.org/docs/Table/Table.mapToClass() for more info.
class PapersDb extends Dexie {
  papers: Dexie.Table<PaperData, string>
  meta: Dexie.Table<Meta, number>
  imgs: Dexie.Table<Img, string>
  savedQueries: Dexie.Table<SavedQuery, string>
  deletedEntries: Dexie.Table<DeletedEntry, string>
  todos: Dexie.Table<ToDo, string>

  constructor (dbName: string) {
      super(dbName)
      this.version(1).stores({
        // only declare properties you want to index (use in .where())
        papers: "id, title, abstract, tags",
        meta: "id", // n_papers_since_backup, tags
      })
      this.version(2).stores({
        imgs: "id" // dataUrl
      })
      this.version(3).stores({
        savedQueries: "id, name", // searchString, tags
      })
      this.version(4).upgrade(trans => {
        trans.table("papers").toCollection().modify(paper => {
          paper.lastSyncTime = -1
          paper.lastModifiedTime = Date.now()
        })
      })
      this.version(5).stores({
        deletedEntries: "id", // lastSyncTime
      })
      this.version(6).stores({
        todos: "id++, paperId, deadline", // text, tags, priority
      })
      this.version(7).stores({
        todos: "id++, entryId, deadline",
      }).upgrade(trans => {
        trans.table("papers").toCollection().modify(paper => {
          paper.notes = paper.abstract
          delete paper.abstract
          paper.table = "papers"
        })
        trans.table("todos").toCollection().modify(todo => {
          todo.table = "todos"
        })
      })
      this.papers = this.table('papers')
      this.meta = this.table('meta')
      this.meta.mapToClass(Meta)
      this.imgs = this.table('imgs')
      this.savedQueries = this.table("savedQueries")
      this.deletedEntries = this.table("deletedEntries")
      this.todos = this.table("todos")
  }
}

async function getMeta(db: PapersDb) {
  let metas = await db.meta.toArray()
  let meta
  if (!metas.length) {
    meta = new Meta()
    db.meta.add(meta)
  } else {
    if (metas.length > 1) {
      console.log("Warning: found multiple meta entries! Only using the first.")
      console.log(metas)
    }
    meta = metas[0]
  }
  return meta
}

async function exportDB(db: PapersDb) {
  const exportTables = ["papers", "savedQueries"]
  return await _exportDB(
    db,
    {prettyJson: true, filter: (table, value, key) => exportTables.includes(table)}
  )
}

const DB = new PapersDb("paper-helper")
export {DB, getMeta, PapersDb, Meta, SavedQuery, exportDB, DeletedEntry}

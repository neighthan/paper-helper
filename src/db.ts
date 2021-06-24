import Dexie from "dexie"
import {PaperData} from "@/paper_types"

class Meta {
  id: number
  _n_papers_since_backup: number
  _tags: string[]
  _dropboxToken: string
  _redditUserAgent: string
  _redditClientId: string
  _redditClientSecret: string
  _redditUsername: string

  constructor(
    id = 0,
    n_papers_since_backup = 0,
    tags: string[] = [],
    dropboxToken = "",
    redditUserAgent = "",
    redditClientId = "",
    redditClientSecret = "",
    redditUsername = "",
  ) {
    this.id = id
    this._n_papers_since_backup = n_papers_since_backup
    this._tags = tags
    this._dropboxToken = dropboxToken
    this._redditUserAgent = redditUserAgent
    this._redditClientId = redditClientId
    this._redditClientSecret = redditClientSecret
    this._redditUsername = redditUsername
  }

  // dexie didn't like using a getter for id, but we don't want a setter anyway, so
  // it's not a problem (just can't make it readonly)
  get n_papers_since_backup() {
    return this._n_papers_since_backup
  }
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
  set n_papers_since_backup(n_papers_since_backup) {
    this._n_papers_since_backup = n_papers_since_backup
    this._updateDb()
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
      this.papers = this.table('papers')
      this.meta = this.table('meta')
      this.meta.mapToClass(Meta)
      this.imgs = this.table('imgs')
      this.savedQueries = this.table("savedQueries")
      this.deletedEntries = this.table("deletedEntries")
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

const DB = new PapersDb("paper-helper")
export {DB, getMeta, PapersDb, Meta, SavedQuery}

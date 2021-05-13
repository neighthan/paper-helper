import Dexie from "dexie"
import {PaperData} from "@/paper_types"

class Meta {
  id: number
  _n_papers_since_backup: number
  _tags: string[]
  _dropboxToken: string
  constructor(
    id: number,
    n_papers_since_backup: number,
    tags: string[],
    dropboxToken: string,
  ) {
    this.id = id
    this._n_papers_since_backup = n_papers_since_backup
    this._tags = tags
    this._dropboxToken = dropboxToken
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

class PapersDb extends Dexie {
  papers: Dexie.Table<PaperData, string>
  meta: Dexie.Table<Meta, number>
  imgs: Dexie.Table<Img, string>
  savedQueries: Dexie.Table<SavedQuery, string>

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
      this.papers = this.table('papers')
      this.meta = this.table('meta')
      this.meta.mapToClass(Meta)
      this.imgs = this.table('imgs')
      this.savedQueries = this.table("savedQueries")
  }
}
const DB = new PapersDb("paper-helper")

export {DB, PapersDb, Meta, SavedQuery}

import { genId } from "@/utils"

class Entry {
  id = genId()
  title = ""
  tags: string[] = []
  notes = ""
  time_added = Date.now()
  priority = 0
  table = "" // must be overridden by subclasses
  lastSyncTime?: number // use -1 for never synced to dropbox; undefined if no syncing
  lastModifiedTime = Date.now()
  iv?: Uint8Array

  get dateString() {
    return new Date((<any> this).date || this.time_added).toLocaleString("default", {month: "short", year: "numeric"})
  }
}

export {Entry}

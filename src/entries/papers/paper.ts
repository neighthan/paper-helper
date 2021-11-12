import {Entry} from "@/entries/entry"

export class PaperData extends Entry {
  date = new Date().toISOString().split("T")[0].replaceAll("-", "/")
  url = ""
  authors: string[] = []
  lastSyncTime = -1
  table = "papers"
}

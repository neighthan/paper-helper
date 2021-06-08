import { genId } from "./utils"

export class PaperData {
  id = genId()
  title = ""
  abstract = ""
  tags: string[] = []
  date = ""
  time_added = Date.now()
  priority = 0
  url = ""
  authors: string[] = []
}
// keys are paper.id
export type CachedPaperData = {
  [key: string]: PaperData
}
export type PaperTempDatum = {
  search_string: string,
  search_tags: Set<string>,
  date_string: string,
}
export type PaperTempData = {
  [key: string]: PaperTempDatum
}

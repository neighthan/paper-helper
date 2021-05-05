export type PaperData = {
  id: string,
  title: string,
  abstract: string,
  tags: string[],
  date: string,
  time_added: number,
  priority: number,
  url: string,
  authors: string[],
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

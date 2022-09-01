import {Entry} from "@/entries/entry"

export class PaperData extends Entry {
  date: string
  url: string
  authors: string[]

  constructor(
    {url = "", authors = [], date = new Date().toISOString().split("T")[0].replaceAll("-", "/"), ...rest}:
    {url?: string, authors?: string[], date?: string, [etc: string]: any} = {}
  ) {
    super(rest)
    this.url = url
    this.authors = authors
    this.date = date
  }
}

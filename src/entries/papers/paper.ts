import {Entry} from "@/entries/entry"

export class Paper extends Entry {
  date: string
  url: string
  authors: string[]

  constructor(
    {url = "", authors = [], date = "", ...rest}:
    {url?: string, authors?: string[], date?: string, [etc: string]: any} = {}
  ) {
    super(rest)
    this.url = url
    this.authors = authors
    if (date === "") {
      this.date = new Date(this.timeAdded).toISOString().split("T")[0].replaceAll("-", "/")
    } else {
      this.date = date
    }
  }
}

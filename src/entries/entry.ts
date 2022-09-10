import { genId } from "@/utils"

class Entry {
  id: string
  title: string
  tags: string[]
  content: string
  timeAdded: number
  priority: number
  entryClass: string
  iv?: Uint8Array
  extraParams?: {[key: string]: any}

  constructor(
    {id = genId(), title = "", tags = [], content = "", timeAdded = Date.now(), priority = 0, ...rest}:
    {id?: string, title?: string, tags?: string[], content?: string, timeAdded?: number, priority?: number, [etc: string]: any} = {}
  ) {
    this.id = id
    this.title = title
    this.tags = tags
    this.content = content
    this.timeAdded = timeAdded
    this.priority = priority
    this.entryClass = this.constructor.name
    this.extraParams = rest
  }

  get dateString() {
    return new Date((<any> this).date || this.timeAdded).toLocaleString("default", {month: "short", year: "numeric"})
  }

  get searchString() {
    return `${this.title.toLowerCase()} ${this.content.toLowerCase()}`
  }

  get searchTags() {
    return getPrefixSet(this.tags)
  }

  get notesMd() {
    return this.content
  }
  set notesMd(md: string) {
    this.content = md
  }
  get expansionItemMd() {
    return this.notesMd
  }
  set expansionItemMd(md: string) {
    this.notesMd = md
  }
}

function getPrefixSet(tags: string[]) {
  const prefixes = new Set([""])
  for (let tag of tags.map(tag => tag.toLowerCase())) {
    for (let i = 1; i <= tag.length; i++) {
      prefixes.add(tag.slice(0, i))
    }
  }
  return prefixes
}

export {Entry}

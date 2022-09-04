// TODO when vue3: if I make a SavedQueries class (which has an array of SavedQuerys
// inside) and move these methods (add, delete, etc.) onto that, will reactivity
// just work? Or would I still need something like Vue.set and Vue.delete like now?

import { Entry } from "@/entries/entry"
import {fromMarkdown, FS, joinPath, readFile, writeFile} from "./files"

const SAVED_QUERY_DIR = "/entries/SavedQuery"

class SavedQuery extends Entry {
  filter: string
  entryType: string

  constructor({filter, entryType, ...rest}: {filter: string, entryType: string, [etc: string]: any}) {
    super(rest)
    this.filter = filter
    this.entryType = entryType
  }
}

// todo: function to check that object parsed from toml is a valid
// SavedQuery. There's a way to make TS view this as a type guard...
// something with `as SavedQuery`

// https://stackoverflow.com/a/56191195/4880003
function isSavedQuery(obj: unknown): obj is SavedQuery {
  return (
    obj !== null &&
    typeof obj === "object"
    // todo
  )
}

async function loadSavedQueries() {
  let files: string[]
  try {
    files = await FS.readdir(SAVED_QUERY_DIR)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("ENOENT: ")) {
      files = []
      await FS.mkdir(SAVED_QUERY_DIR)
    } else {
      throw e
    }
  }
  const savedQueries: SavedQuery[] = []
  for (let file of files) {
    savedQueries.push(await loadSavedQuery(file))
  }
  return savedQueries
}

/**
 * @param id can be id or <id>.md
 */
async function loadSavedQuery(id: string) {
  if (!id.endsWith(".md")) {
    id = `${id}.md`
  }

  const obj = fromMarkdown(await readFile(joinPath(SAVED_QUERY_DIR, id)))
  return new SavedQuery(obj as any) // todo?
}

export {SavedQuery, loadSavedQueries, loadSavedQuery}

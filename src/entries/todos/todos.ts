import { deleteEntryFile, readAllEntries, readEntryFile, writeEntryFile } from "@/backend/files"
import {Entry} from "@/entries/entry"

const REMOVE = 0
const RESTORE = 1
const UPDATE = 2

// don't sync to dbx; instead, just recompute the todos after you finish
// dbx syncing (if you want to be faster, only for the papers that've
// been modified)
class ToDo extends Entry{
  entryId = "" // entry this todo was pulled from; empty if no entry
  entryClass = "" // class of the entry, if entryId given
  entryStartLine = -1 // -1 means this ToDo didn't come from another entry
  entryEndLine = -1
  deadline = ""
  table = "todos"

  /**
   * @param entry used to determine which tags are from the entry and shouldn't be
   *   included in the todo's string version.
   */
  asString(entry: Entry) {
    let entryString = "@TODO"
    const tags = this.tags.filter(t => !entry.tags.includes(t))
    if (tags.length) {
      entryString += `[${tags.join(", ")}]`
    }
    entryString += `{${this.priority}}`
    if (this.deadline) {
      entryString += `(${this.deadline})`
    }
    entryString += ` ${this.title}`
    if (this.content) {
      entryString += ` {{${this.content}}}`
    }
    return entryString
  }

  async removeFromEntry() {
    this._update(REMOVE)
  }

  async restoreToEntry() {
    this._update(RESTORE)
  }

  async updateInEntry() {
    this._update(UPDATE)
  }

  async _update(mode: typeof REMOVE | typeof RESTORE | typeof UPDATE) {
    if (!this.entryId) return
    const entry = await readEntryFile(this.entryClass, this.entryId)
    const todoString = this.asString(entry)
    const lines = entry.content.split("\n")
    if (!lines[this.entryStartLine].toLowerCase().startsWith("@todo")) {
      console.error(`Expected a todo on line ${this.entryStartLine} of`, entry)
      return
    }
    if (!(this.entryEndLine === this.entryStartLine || lines[this.entryEndLine].endsWith("}}"))) {
      console.error(`End line ${lines[this.entryEndLine]} at ${this.entryEndLine} didn't end with "}}".`)
      return
    }

    if (mode === REMOVE) {
      // don't change the start and end lines. If the ToDo is really completed / deleted,
      // it'll be removed anyway, so it doesn't matter. If the deletion is undone, we'll
      // need the start line to know where to insert it back in.
      entry.content = (
        lines.slice(0, this.entryStartLine)
        .concat(lines.slice(this.entryEndLine + 1))
      ).join("\n")
    } else if (mode === RESTORE) {
      entry.content = (
        lines.slice(0, this.entryStartLine)
        .concat(todoString)
        .concat(lines.slice(this.entryStartLine))
      ).join("\n")
    } else {
      // test this
      entry.content = (
        lines.slice(0, this.entryStartLine)
        .concat(todoString)
        .concat(lines.slice(this.entryEndLine + 1))
      ).join("\n")
    }

    // the length of this ToDo might have changed, so update the end line
    this.entryEndLine = this.entryStartLine + todoString.split("\n").length - 1
    writeEntryFile(entry)
    writeEntryFile(this)
  }
}

// get all of the todos from the paper
// format of the todos:
// @TODO[tag1, tag2]{80}(11/16/2021) short-text {{long-text}}
// tags, priority, and deadline are optional but, if given, must be in this order.
// short-text will be the title for the todo.
// long-text is optional and will be used for the notes field. It can span
// multiple lines but the }} must be at the end of a line.
// just use a regex for this?
function getTodos(entry: Entry) {
  const todos: ToDo[] = []
  const lines = entry.content.split("\n")
  let i = 0
  while (i < lines.length) {
    let line = lines[i++]
    if (!line.toLowerCase().startsWith("@todo")) continue
    line = line.substring(5)
    const todo = new ToDo()
    todo.entryStartLine = i - 1
    todo.tags = [...entry.tags]
    todo.priority = entry.priority
    if (line.startsWith("[")) {
      const tagsEnd = line.indexOf("]")
      todo.tags.push(...line.substring(1, tagsEnd).split(",").map(t => t.trim()))
      line = line.substring(tagsEnd + 1)
    }
    if (line.startsWith("{")) {
      const priorityEnd = line.indexOf("}")
      todo.priority = parseInt(line.substring(1, priorityEnd))
      line = line.substring(priorityEnd + 1)
    }
    if (line.startsWith("(")) {
      const deadlineEnd = line.indexOf(")")
      todo.deadline = line.substring(1, deadlineEnd)
      line = line.substring(deadlineEnd + 1)
    }
    if (line.includes("{{")) {
      todo.title = line.split("{{")[0]
      todo.content = line.split("{{")[1]
      // if there is no }}, juse use the rest of the text
      while (!todo.content.endsWith("}}") && i < lines.length) {
        line = lines[i++]
        todo.content += "\n" + line.trim()
      }
      if (todo.content.endsWith("}}")) {
        todo.content = todo.content.slice(0, todo.content.length - 2)
      }
    } else {
      todo.title = line
    }
    todo.entryEndLine = i - 1
    todo.entryId = entry.id
    todo.entryClass = entry.constructor.name
    todos.push(todo)
  }
  return todos
}

/**
 * Deletes any existing todos for `entry` and adds new ones.
 */
async function updateTodos(entry: Entry) {
  const todos = getTodos(entry)
  console.log("found todos:", todos)
  if (todos.length === 0) return
  await deleteTodos(entry)
  await Promise.all(todos.map(writeEntryFile))
}

async function deleteTodos(entry: Entry) {
  // TODO!! this will be slow now; without an index we have to check each file.
  // should we just make an index file for this?
  for (const todo of await readAllEntries("ToDo")) {
    if ((<ToDo> todo).entryId === entry.id) {
      deleteEntryFile(todo)
    }
  }
}

export {updateTodos, deleteTodos, ToDo}

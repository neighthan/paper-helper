import {Entry} from "@/entries/entry"
import {DB} from "@/db"

// don't sync to dbx; instead, just recompute the todos after you finish
// dbx syncing (if you want to be faster, only for the papers that've
// been modified)
class ToDo extends Entry{
  entryId = "" // entry this todo was pulled from; empty if no entry
  entryTable = "" // name of the dexie table with the entry, if entryId given
  deadline = ""
  table = "todos"
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
  const lines = entry.notes.split("\n")
  let i = 0
  while (i < lines.length) {
    let line = lines[i++]
    if (!line.toLowerCase().startsWith("@todo")) continue
    line = line.substring(5)
    const todo = new ToDo()
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
      todo.notes = line.split("{{")[1]
      // if there is no }}, juse use the rest of the text
      while (!todo.notes.endsWith("}}") && i < lines.length) {
        line = lines[i++]
        todo.notes += "\n" + line.trim()
      }
      if (todo.notes.endsWith("}}")) {
        todo.notes = todo.notes.slice(0, todo.notes.length - 2)
      }
    } else {
      todo.title = line
    }
    todo.entryId = entry.id
    todo.entryTable = entry.table
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
  await DB.transaction("rw", DB.todos, async () => {
    await deleteTodos(entry)
    await DB.todos.bulkAdd(todos)
  }).catch(reason => {
    console.error(reason)
  })
}

async function deleteTodos(entry: Entry) {
  await DB.todos.where("entryId").equals(entry.id).delete()
}

export {updateTodos, deleteTodos, ToDo}

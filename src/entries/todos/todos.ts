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
// @TODO[tag1, tag2]{80}(11/16/2021) text
// tags, priority, and deadline are optional but, if given, must be in this order
function getTodos(entry: Entry) {
  const todos: ToDo[] = []
  for (let line of entry.notes.split("\n")) {
    if (!line.startsWith("@TODO")) continue
    line = line.substring(5)
    let tags = entry.tags
    let priority = entry.priority
    let deadline = ""
    if (line.startsWith("[")) {
      const tagsEnd = line.indexOf("]")
      tags = line.substring(1, tagsEnd).split(",").map(t => t.trim())
      line = line.substring(tagsEnd + 1)
    }
    if (line.startsWith("{")) {
      const priorityEnd = line.indexOf("}")
      priority = parseInt(line.substring(1, priorityEnd))
      line = line.substring(priorityEnd + 1)
    }
    if (line.startsWith("(")) {
      const deadlineEnd = line.indexOf(")")
      deadline = line.substring(1, deadlineEnd)
      line = line.substring(deadlineEnd + 1)
    }
    const todo = new ToDo()
    todo.notes = line.trim()
    todo.priority = priority
    todo.tags = tags
    todo.entryId = entry.id
    todo.entryTable = entry.table
    todo.deadline = deadline
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

import {PaperData} from "@/paper_types"
import {genId} from "@/utils"
import {DB} from "@/db"

// don't sync to dbx; instead, just recompute the todos after you finish
// dbx syncing (if you want to be faster, only for the papers that've
// been modified)
// to get closer to having more general entry types, make some Entry
// base class and have both Paper and ToDO inherit from it? Then
// use that as the type for the UI in Search.vue and
type ToDo = {
  id: string,
  text: string,
  paperId: string, // paper this todo was pulled from; empty if no paper
  tags: string[],
  priority: number,
  deadline: string,
}

// put this into a separate function
// get all of the todos from the paper
// format of the todos:
// @TODO[tag1, tag2]{80}(11/16/2021) text
// tags, priority, and deadline are optional but, if given, must be in this order
function getTodos(paper: PaperData) {
  const todos: ToDo[] = []
  for (let line of paper.abstract.split("\n")) {
    if (!line.startsWith("@TODO")) continue
    line = line.substring(5)
    let tags = paper.tags
    let priority = paper.priority
    let deadline = ""
    if (line.startsWith("[")) {
      const tagsEnd = line.indexOf("]")
      tags = line.substring(1, tagsEnd).split(",")
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
    todos.push({
      text: line.trim(),
      priority: priority,
      tags: tags,
      paperId: paper.id,
      deadline: deadline,
      id: genId(),
    })
  }
  return todos
}

/**
 * Deletes any existing todoos for `paper` and adds new ones.
 */
async function updatePaperTodos(paper: PaperData) {
  const todos = getTodos(paper)
  if (todos.length === 0) return
  DB.transaction("rw", DB.todos, async () => {
    deletePaperTodos(paper)
    DB.todos.bulkAdd(todos)
  })
}

async function deletePaperTodos(paper: PaperData) {
  await DB.todos.where("paperId").equals(paper.id).delete()
}

export {updatePaperTodos, deletePaperTodos, ToDo}

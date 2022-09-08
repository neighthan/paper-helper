import {SavedQuery} from '@/backend/savedQueries'
import {Paper} from './papers/paper'
import {ToDo} from "@/entries/todos/todos"

// because of some issues with circular imports, ToDo won't be defined yet when you get
// here, so we make a function to return the EntryTypes rather than making them directly

function getEntryTypes() {
  const PaperTypes = {
    key: <"Paper"> "Paper",
    component: <"PaperDialog"> "PaperDialog",
    class: new Paper(),
    ctor: Paper,
  }

  const TodoTypes = {
    key: <"ToDo"> "ToDo",
    component: <"ToDoDialog"> "ToDoDialog",
    class: new ToDo(),
    ctor: ToDo,
  }

  const SavedQueryTypes = {
    key: <"SavedQuery"> "SavedQuery",
    component: <"SavedQueryDialog"> "SavedQueryDialog",
    class: new SavedQuery({filter: "", entryType: ""}),
    ctor: SavedQuery,
  }

  return {Paper: PaperTypes, ToDo: TodoTypes, SavedQuery: SavedQueryTypes}
}

export {getEntryTypes}

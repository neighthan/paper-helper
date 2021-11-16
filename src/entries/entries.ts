import {DB} from '@/db'
import {PaperData} from './papers/paper'
import {ToDo} from './todos/todos'

const PaperTypes = {
  key: <"paper"> "paper",
  component: <"PaperDialog"> "PaperDialog",
  table: DB.papers,
  class: new PaperData(),
  ctor: PaperData,
}

const TodoTypes = {
  key: <"todo"> "todo",
  component: <"ToDoDialog"> "ToDoDialog",
  table: DB.todos,
  class: new ToDo(),
  ctor: ToDo,
}
const EntryTypes = {paper: PaperTypes, todo: TodoTypes}

export {EntryTypes}

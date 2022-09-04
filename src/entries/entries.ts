import {PaperData} from './papers/paper'
import {ToDo} from './todos/todos'

const PaperTypes = {
  key: <"paper"> "paper",
  component: <"PaperDialog"> "PaperDialog",
  class: new PaperData(),
  ctor: PaperData,
}

const TodoTypes = {
  key: <"todo"> "todo",
  component: <"ToDoDialog"> "ToDoDialog",
  class: new ToDo(),
  ctor: ToDo,
}
const EntryTypes = {paper: PaperTypes, todo: TodoTypes}

export {EntryTypes}

<template>
  <v-dialog
    v-model="showDialog"
    persistent
    :fullscreen="$vuetify.breakpoint.xsOnly"
    @keydown.ctrl.s.prevent="save"
  >
    <v-card>
      <v-card-text>
        <v-text-field label="Title" v-model="title" dense autofocus></v-text-field>
        <v-combobox label="Tags" v-model="tags" :items="all_tags" multiple :delimiters="[' ']" dense small-chips>
        </v-combobox>
        <v-row>
          <v-col>
            <v-text-field label="Priority" v-model="priority" dense></v-text-field>
          </v-col>
          <v-col>
            <v-text-field label="Deadline (YYYY/MM/DD)" v-model="deadline" dense></v-text-field>
          </v-col>
        </v-row>
        <v-textarea label="Content" v-model="content" rows=11 no-resize dense></v-textarea>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-btn color="primary" text @click="save">
          Save
        </v-btn>
        <v-btn color="error" text @click="cancel">
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator"
import {genId} from "../../utils"
import {ToDo} from "./todos"
import Settings from "@/backend/settings"

const DB: any = 0

@Component
export default class ToDoDialog extends Vue {
  @Prop() private all_tags!: string[]
  id = "" // id of entry being updated
  timeAdded = -1
  title = ""
  url = ""
  tags: string[] = []
  priority = "0"
  content = ""
  deadline = ""
  lastSyncTime = -1
  showDialog = false
  entryId = ""
  entryClass = ""
  entryStartLine = -1
  entryEndLine = -1

  show(todo: ToDo) {
    this.updateFields(todo)
    this.showDialog = true
  }

  updateFields(todo: ToDo) {
    this.id = todo.id
    this.priority = todo.priority.toString()
    this.tags = [...todo.tags]
    this.title = todo.title
    this.content = todo.content
    this.timeAdded = todo.timeAdded
    this.deadline = todo.deadline
    this.entryId = todo.entryId
    this.entryClass = todo.entryClass
    this.entryStartLine = todo.entryStartLine
    this.entryEndLine = todo.entryEndLine
  }

  get editedToDo() {
    const todo = new ToDo()
    todo.id = this.id
    todo.priority = parseFloat(this.priority)
    todo.tags = this.tags.map(tag => tag.trim())
    todo.title = this.title
    todo.content = this.content
    todo.timeAdded = this.timeAdded
    todo.deadline = this.deadline
    todo.entryId = this.entryId
    todo.entryClass = this.entryClass
    todo.entryStartLine = this.entryStartLine
    todo.entryEndLine = this.entryEndLine
    todo.table = "todos"
    return todo
  }
  cancel() {
    this.showDialog = false
    this.$emit("cancelled")
  }
  async save() {
    this.showDialog = false
    const todo = this.editedToDo
    if (!todo.id) {
      todo.timeAdded = Date.now()
      todo.id = genId()
    }
    await DB.transaction("rw", DB.meta, DB.todos, async () => {
      DB.todos.put(todo)
      Settings.tags = [...new Set(Settings.tags.concat(todo.tags))]
    })
    todo.updateInEntry()
    this.$emit("addEntry", todo)
  }
}
</script>

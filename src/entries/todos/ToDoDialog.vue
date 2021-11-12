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
            <v-text-field label="Date (YYYY/MM/DD)" v-model="date" dense></v-text-field>
          </v-col>
        </v-row>
        <v-textarea label="Abstract" v-model="abstract" rows=11 no-resize dense></v-textarea>
        <v-text-field label="Authors" v-model="authors" dense></v-text-field>
        <v-text-field label="URL" v-model="url" dense></v-text-field>
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
import {DB, getMeta} from "../../db"
import {ToDo} from "./todos"

@Component
export default class ToDoDialog extends Vue {
  @Prop() private all_tags!: string[]
  id = "" // id of entry being updated
  timeAdded = -1
  title = ""
  url = ""
  tags: string[] = []
  priority = "0"
  authors = ""
  notes = ""
  deadline = ""
  lastSyncTime = -1
  showDialog = false
  entryId = ""
  entryTable = ""

  show(todo: ToDo) {
    this.updateFields(todo)
    this.showDialog = true
  }

  updateFields(todo: ToDo) {
    this.id = todo.id
    this.priority = todo.priority.toString()
    this.tags = [...todo.tags]
    this.title = todo.title
    this.notes = todo.notes
    this.timeAdded = todo.time_added
    this.deadline = todo.deadline
    this.entryId = todo.entryId
    this.entryTable = todo.entryTable
  }

  get editedToDo() {
    const todo = new ToDo()
    todo.id = this.id
    todo.priority = parseFloat(this.priority)
    todo.tags = this.tags.map(tag => tag.trim())
    todo.title = this.title
    todo.notes = this.notes
    todo.time_added = this.timeAdded
    todo.deadline = this.deadline
    todo.lastModifiedTime = Date.now()
    todo.entryId = this.entryId
    todo.entryTable = this.entryTable
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
    todo.lastModifiedTime = Date.now()
    if (!todo.id) {
      todo.time_added = Date.now()
      todo.id = genId()
    }
    const meta = await getMeta(DB)
    await DB.transaction("rw", DB.meta, DB.todos, async () => {
      DB.todos.put(todo)
      meta.tags = [...new Set(meta.tags.concat(todo.tags))]
    })
    this.$emit("addEntry", todo)
  }
}
</script>

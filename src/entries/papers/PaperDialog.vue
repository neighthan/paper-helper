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
        <v-textarea label="Notes" v-model="notes" rows=11 no-resize dense></v-textarea>
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
import { PaperData } from "./paper"
import {genId} from "../../utils"
import {DB, getMeta} from "../../db"
import {updateTodos} from "../todos/todos"

@Component
export default class PaperDialog extends Vue {
  @Prop() private all_tags!: string[]
  id = "" // id of paper being updated
  timeAdded = -1
  title = ""
  url = ""
  tags: string[] = []
  priority = "0"
  authors = ""
  notes = ""
  date = ""
  lastSyncTime = -1
  showDialog = false

  show(paper: PaperData) {
    this.updateFields(paper)
    this.showDialog = true
  }

  updateFields(paper: PaperData) {
    this.id = paper.id
    this.priority = paper.priority.toString()
    this.tags = [...paper.tags]
    this.title = paper.title
    this.url = paper.url
    this.notes = paper.notes
    this.authors = paper.authors.join(", ")
    this.timeAdded = paper.time_added
    this.date = paper.date
    this.lastSyncTime = paper.lastSyncTime
  }

  get editedPaper() {
    const paper = new PaperData()
    paper.id = this.id
    paper.priority = parseFloat(this.priority)
    paper.tags = this.tags.map(tag => tag.trim())
    paper.title = this.title
    paper.url = this.url
    paper.notes = this.notes
    paper.authors = this.authors.split(", ")
    paper.time_added = this.timeAdded
    paper.date = this.date
    paper.lastSyncTime = this.lastSyncTime
    paper.lastModifiedTime = Date.now()
    paper.table = "papers"
    return paper
  }
  cancel() {
    this.showDialog = false
    this.$emit("cancelled")
  }
  async save() {
    this.showDialog = false
    const paper = this.editedPaper
    paper.lastModifiedTime = Date.now()
    if (!paper.id) {
      paper.time_added = Date.now()
      paper.id = genId()
    }
    const meta = await getMeta(DB)
    await DB.transaction("rw", DB.meta, DB.papers, DB.todos, async () => {
      DB.papers.put(paper)
      updateTodos(paper)
      meta.tags = [...new Set(meta.tags.concat(paper.tags))]
    })
    this.$emit("addEntry", paper)
  }
}
</script>

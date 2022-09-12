<template>
  <v-dialog
    v-model="showDialog"
    persistent
    :fullscreen="$vuetify.breakpoint.xsOnly"
    @keydown.ctrl.s.prevent="save"
  >
    <v-card>
      <v-card-title>New Paper</v-card-title>
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
        <v-textarea label="Content" v-model="content" rows=11 no-resize dense></v-textarea>
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
import { Paper } from "./paper"
import {genId} from "../../utils"
import {updateTodos} from "../todos/todos"
import Settings from "@/backend/settings"
import { writeEntryFile } from "@/backend/files"

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
  content = ""
  date = ""
  lastSyncTime = -1
  showDialog = false

  show(paper: Paper) {
    this.updateFields(paper)
    this.showDialog = true
  }

  updateFields(paper: Paper) {
    this.id = paper.id
    this.priority = paper.priority.toString()
    this.tags = [...paper.tags]
    this.title = paper.title
    this.url = paper.url
    this.content = paper.content
    this.authors = paper.authors.join(", ")
    this.timeAdded = paper.timeAdded
    this.date = paper.date
  }

  get editedPaper() {
    const paper = new Paper()
    paper.id = this.id
    paper.priority = parseFloat(this.priority)
    paper.tags = this.tags.map(tag => tag.trim())
    paper.title = this.title
    paper.url = this.url
    paper.content = this.content
    paper.authors = this.authors.split(", ")
    paper.timeAdded = this.timeAdded
    paper.date = this.date
    return paper
  }
  cancel() {
    this.showDialog = false
    this.$emit("cancelled")
  }
  async save() {
    this.showDialog = false
    const paper = this.editedPaper
    if (!paper.id) {
      paper.timeAdded = Date.now()
      paper.id = genId()
    }
    await writeEntryFile(paper)
    await updateTodos(paper)
    Settings.tags = [...new Set(Settings.tags.concat(paper.tags))]
    this.$emit("addEntry", paper)
  }
}
</script>

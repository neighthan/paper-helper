<template>
  <div id="new-paper-dialog">
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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator"
import { PaperData } from "@/paper_types"

@Component
export default class PaperDialog extends Vue {
  @Prop() private initialData!: PaperData
  @Prop() private all_tags!: string[]
  id = "" // id of paper being updated
  timeAdded = -1
  title = ""
  url = ""
  tags: string[] = []
  priority = "0"
  authors = ""
  abstract = ""
  date = ""

  created() {
    if (this.initialData) {
      this.updateFields(this.initialData)
    }
  }

  updateFields(paper: PaperData) {
    this.id = paper.id
    this.priority = paper.priority.toString()
    this.tags = paper.tags // TODO: need to copy?
    this.title = paper.title
    this.url = paper.url
    this.abstract = paper.abstract
    this.authors = paper.authors.join(", ")
    this.timeAdded = paper.time_added
    this.date = paper.date
  }

  resetFields() {
    this.id = ""
    this.timeAdded = -1
    this.title = ""
    this.url = ""
    this.tags = []
    this.priority = "0"
    this.authors = ""
    this.abstract = ""
    this.date = ""
  }

  @Watch("initialData")
  onPaperChanged(newPaper: PaperData, oldPaper: PaperData) {
    if (newPaper) {
      this.updateFields(newPaper)
    }
  }

  get editedPaper() {
    return {
        id: this.id,
        priority: parseFloat(this.priority),
        tags: this.tags.map(tag => tag.trim()),
        title: this.title,
        url: this.url,
        abstract: this.abstract,
        authors: this.authors.split(", "),
        time_added: this.timeAdded,
        date: this.date,
      }
  }
  save() {
    this.$emit("addPaper", true, this.editedPaper)
    this.resetFields()
  }
  cancel() {
    this.$emit("addPaper", false, this.editedPaper)
    this.resetFields()
  }
}
</script>

<style scoped lang="scss">
</style>

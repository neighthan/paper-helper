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
  id = -1 // id of paper being updated
  timeAdded = -1
  title = ""
  url = ""
  tags: string[] = []
  priority = "0"
  authors = ""
  abstract = ""
  date = ""

  @Watch("initialData")
  onPaperChanged(newPaper: PaperData, oldPaper: PaperData) {
    if (newPaper) {
      this.id = newPaper.id
      this.priority = newPaper.priority.toString()
      this.tags = newPaper.tags // TODO: need to copy?
      this.title = newPaper.title
      this.url = newPaper.url
      this.abstract = newPaper.abstract
      this.authors = newPaper.authors.join(", ")
      this.timeAdded = newPaper.time_added
      this.date = newPaper.date
    } else {
      this.id = -1 // id of paper being updated
      this.timeAdded = -1
      this.title = ""
      this.url = ""
      this.tags = []
      this.priority = "0"
      this.authors = ""
      this.abstract = ""
      this.date = ""
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
  }
  cancel() {
    this.$emit("addPaper", false, this.editedPaper)
  }
}
</script>

<style scoped lang="scss">
</style>

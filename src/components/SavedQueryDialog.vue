<template>
  <div id="saved-query-dialog">
    <v-card>
      <v-card-text>
        <v-text-field label="Name" v-model="title" dense autofocus></v-text-field>
        <v-combobox label="Tags" v-model="tags" :items="allTags" multiple :delimiters="[' ']" dense small-chips>
        </v-combobox>
        <v-text-field label="Search String" v-model="filter" dense></v-text-field>
        <v-autocomplete label="Entry Type" v-model="entryType" dense :items="entryTypes"></v-autocomplete>
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
import {SavedQuery} from "@/backend/savedQueries"
import {getEntryTypes} from "@/entries/entries"

const EntryTypes = getEntryTypes()

@Component
export default class SavedQueryDialog extends Vue {
  @Prop() private initialData!: SavedQuery | null
  @Prop() private allTags!: string[]
  id = "" // id of query being updated
  title = ""
  filter = ""
  tags: string[] = []
  timeAdded = -1
  lastSyncTime = -1
  entryType = "paper"
  entryTypes = Object.keys(EntryTypes)

  created() {
    if (this.initialData) {
      this.updateFields(this.initialData)
    }
  }

  updateFields(query: SavedQuery) {
    this.id = query.id
    this.title = query.title
    this.filter = query.filter
    this.tags = [...query.tags]
    this.timeAdded = query.timeAdded
    this.entryType = query.entryType
  }

  resetFields() {
    this.id = ""
    this.title = ""
    this.filter = ""
    this.tags = []
    this.timeAdded = -1
    this.entryType = "Paper"
  }

  @Watch("initialData")
  onQueryChanged(newQuery: SavedQuery, oldQuery: SavedQuery) {
    if (newQuery) {
      this.updateFields(newQuery)
    }
  }

  get editedQuery(): SavedQuery {
    return new SavedQuery({
      filter: this.filter,
      entryType: this.entryType,
      id: this.id,
      title: this.title,
      tags: this.tags.map(tag => tag.trim()),
      timeAdded: this.timeAdded,
      lastSyncTime: this.lastSyncTime,
      lastModifiedTime: Date.now(),
    })
  }

  save() {
    this.$emit("add", true, this.editedQuery)
    this.resetFields()
  }

  cancel() {
    this.$emit("add", false, this.editedQuery)
    this.resetFields()
  }
}
</script>

<style scoped lang="scss">
</style>

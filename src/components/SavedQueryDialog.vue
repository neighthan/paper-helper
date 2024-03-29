<template>
  <div id="saved-query-dialog">
    <v-card>
      <v-card-text>
        <v-text-field label="Name" v-model="name" dense autofocus></v-text-field>
        <v-combobox label="Tags" v-model="tags" :items="allTags" multiple :delimiters="[' ']" dense small-chips>
        </v-combobox>
        <v-text-field label="Search String" v-model="searchString" dense></v-text-field>
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
import {SavedQuery} from "@/db"
import {EntryTypes} from "@/entries/entries"

@Component
export default class SavedQueryDialog extends Vue {
  @Prop() private initialData!: SavedQuery | null
  @Prop() private allTags!: string[]
  id = "" // id of query being updated
  name = ""
  searchString = ""
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
    this.name = query.name
    this.searchString = query.searchString
    this.tags = [...query.tags]
    this.timeAdded = query.timeAdded
    this.lastSyncTime = query.lastSyncTime
    this.entryType = query.entryType
  }

  resetFields() {
    this.id = ""
    this.name = ""
    this.searchString = ""
    this.tags = []
    this.timeAdded = -1
    this.entryType = "PaperData"
  }

  @Watch("initialData")
  onQueryChanged(newQuery: SavedQuery, oldQuery: SavedQuery) {
    if (newQuery) {
      this.updateFields(newQuery)
    }
  }

  get editedQuery(): SavedQuery {
    return {
      id: this.id,
      name: this.name,
      searchString: this.searchString,
      tags: this.tags.map(tag => tag.trim()),
      timeAdded: this.timeAdded,
      lastSyncTime: this.lastSyncTime,
      lastModifiedTime: Date.now(),
      entryType: this.entryType,
    }
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

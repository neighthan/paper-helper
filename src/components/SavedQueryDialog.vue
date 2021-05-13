<template>
  <div id="saved-query-dialog">
    <v-card>
      <v-card-text>
        <v-text-field label="Name" v-model="name" dense autofocus></v-text-field>
        <v-combobox label="Tags" v-model="tags" :items="allTags" multiple :delimiters="[' ']" dense small-chips>
        </v-combobox>
        <v-text-field label="Search String" v-model="searchString" dense></v-text-field>
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

@Component
export default class PaperDialog extends Vue {
  @Prop() private initialData!: SavedQuery
  @Prop() private allTags!: string[]
  id = "" // id of query being updated
  name = ""
  searchString = ""
  tags: string[] = []
  timeAdded = -1

  updateFields(query: SavedQuery) {
    this.id = query.id
    this.name = query.name
    this.searchString = query.searchString
    this.tags = query.tags // TODO: need to copy?
    this.timeAdded = query.timeAdded
  }

  resetFields() {
    this.id = ""
    this.name = ""
    this.searchString = ""
    this.tags = []
    this.timeAdded = -1
  }

  @Watch("initialData")
  onQueryChanged(newQuery: SavedQuery, oldQuery: SavedQuery) {
    if (newQuery) {
      this.updateFields(newQuery)
    }
  }

  get editedQuery() {
    return {
      id: this.id,
      name: this.name,
      searchString: this.searchString,
      tags: this.tags.map(tag => tag.trim()),
      timeAdded: this.timeAdded,
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

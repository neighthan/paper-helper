<template>
  <div id="home">
    <v-app-bar>
      <NavIcon/>

      <v-spacer></v-spacer>
      <v-col>
        <v-text-field autofocus v-model="search" @keydown.enter="openFirst" append-icon="search"></v-text-field>
      </v-col>
      <v-spacer></v-spacer>

      <v-dialog v-model="dialog">
        <template v-slot:activator="{on, attrs}">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>add</v-icon>
          </v-btn>
        </template>
        <SavedQueryDialog :initialData="editingQuery" :allTags="allTags" @add="add"/>
      </v-dialog>
    </v-app-bar>
    <v-main>
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex v-for="query of sortedFilteredQueries" :key="query.id">
            <v-card>
              <v-card-title>{{query.name}}</v-card-title>
              <v-card-actions>
                <v-btn text @click="open(query)">Open</v-btn>
                <v-btn icon @click="edit(query)"><v-icon>edit</v-icon></v-btn>
                <v-btn icon @click="remove(query)"><v-icon>delete</v-icon></v-btn>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
        <v-snackbar v-model="showUndeleteSnackbar">
          Saved query deleted.
          <v-btn text color="red" @click="undeleteQuery">Undo</v-btn>
        </v-snackbar>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
// TODO: look at vuetify docs to see if this is a good way to make the grid; I just
// cobbled this together from some quick googling.

// pull the card out to be in components?
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import {DB, getMeta, SavedQuery} from "../db"
import {genId} from "../utils"
import SavedQueryDialog from "@/components/SavedQueryDialog.vue"


@Component({components: {NavIcon, SavedQueryDialog}})
export default class Home extends Vue {
  dialog = false
  showUndeleteSnackbar = false
  allTags: string[] = []
  deletedQuery: SavedQuery | null = null
  editingQuery: SavedQuery | null = null
  savedQueries: {[key: string]: SavedQuery} = {}
  search = ""

  async created() {
    let queries = await DB.savedQueries.toArray()
    this.savedQueries = Object.fromEntries(queries.map(q => [q.id, q]))
    if (Object.keys(this.savedQueries).length === 0) {
      let query: SavedQuery = {
        name: "All",
        tags: [],
        searchString: "",
        id: genId(),
        timeAdded: Date.now(),
        lastSyncTime: -1,
        lastModifiedTime: +new Date(),
      }
      DB.savedQueries.put(query)
      Vue.set(this.savedQueries, query.id, query)
    }
    getMeta(DB).then(meta => {
      this.allTags = meta.tags
    })
  }
  async add(save: boolean, query: SavedQuery) {
    this.dialog = false
    this.editingQuery = null
    if(save) {
      if (!query.id) {
        query.timeAdded = Date.now()
        query.id = genId()
      }
      await DB.savedQueries.put(query)
      Vue.set(this.savedQueries, query.id, query)
    }
  }
  openFirst() {
    this.open(this.sortedFilteredQueries[0])
  }
  open(query: SavedQuery) {
    this.$router.push({path: `/search/${query.id}`})
  }
  edit(query: SavedQuery) {
    this.editingQuery = query
    this.dialog = true
  }
  remove(query: SavedQuery) {
    this.deletedQuery = query
    this.showUndeleteSnackbar = true
    DB.savedQueries.delete(query.id)
    Vue.delete(this.savedQueries, query.id)
  }
  undeleteQuery() {
    this.showUndeleteSnackbar = false
    if (this.deletedQuery !== null) {
      DB.savedQueries.add(this.deletedQuery)
      Vue.set(this.savedQueries, this.deletedQuery.id, this.deletedQuery)
    }
  }
  get sortedFilteredQueries() {
    const queries = Object.values(this.savedQueries)
    return queries
      .filter(q => q.name.toLowerCase().includes(this.search.toLowerCase()))
      .sort((q1, q2) => q1.name.localeCompare(q2.name))
  }
}
</script>

<style scoped lang="scss">
</style>

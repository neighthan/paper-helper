<template>
  <div id="home">
    <v-app-bar>
      <NavIcon/>
      <v-spacer></v-spacer>
      <v-dialog v-model="dialog">
        <template v-slot:activator="{on, attrs}">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>add</v-icon>
          </v-btn>
        </template>
        <SavedQueryDialog :initialData="editingQuery" :allTags="['ml']" @add="add"/>
      </v-dialog>
    </v-app-bar>
    <v-main>
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex v-for="query of Object.values(savedQueries)" :key="query.id">
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
import {DB, SavedQuery} from "../db"
import {genId} from "../utils"
import SavedQueryDialog from "@/components/SavedQueryDialog.vue"


@Component({components: {NavIcon, SavedQueryDialog}})
export default class Home extends Vue {
  dialog = false
  editingQuery: SavedQuery | null = null
  savedQueries: {[key: string]: SavedQuery} = {}

  async created() {
    let queries = await DB.savedQueries.toArray()
    this.savedQueries = Object.fromEntries(queries.map(q => [q.id, q]))
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
  open(query: SavedQuery) {
    this.$router.push({path: `/search/${query.id}`})
  }
  edit(query: SavedQuery) {
    this.editingQuery = query
    this.dialog = true
  }
  remove(query: SavedQuery) {
    console.log("deleting", query)
  }
}
</script>

<style scoped lang="scss">
</style>

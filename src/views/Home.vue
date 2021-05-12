<template>
  <div id="home">
    <v-app-bar>
      <NavIcon/>
    </v-app-bar>
    <v-main>
      <v-container fluid grid-list-md>
        <v-layout row wrap>
          <v-flex v-for="(item, idx) of items" :key="idx">
            <v-card>
              <v-card-title>{{item.name}}</v-card-title>
              <v-card-actions>
                <v-btn text @click="open(item)">Open</v-btn>
                <v-btn icon @click="edit(item)"><v-icon>edit</v-icon></v-btn>
                <v-btn icon @click="remove(item)"><v-icon>delete</v-icon></v-btn>
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

type SavedQuery = {
  name: string,
  searchString: string,
  tags: string[],
}

@Component({components: {NavIcon}})
export default class Home extends Vue {
  items: SavedQuery[] = [
    {
      name: "All",
      searchString: "",
      tags: [],
    },
    {
      name: "Test1",
      searchString: "",
      tags: ["t1"],
    },
    {
      name: "Test12",
      searchString: "",
      tags: ["t1", "t2"],
    },
    {
      name: "Test Tag Search",
      searchString: "apple",
      tags: ["t1"],
    }
  ]
  open(item: SavedQuery) {
    const tags = item.tags.join(",")
    this.$router.push({path: `/search/${tags}`})
  }
  edit(item: SavedQuery) {
    console.log("editing", item)
  }
  remove(item: SavedQuery) {
    console.log("deleting", item)
  }
}
</script>

<style scoped lang="scss">
</style>

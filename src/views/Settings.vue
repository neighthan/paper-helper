<template>
  <div id="settings">
    <v-app-bar app>
      <NavIcon/>
      Settings
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-col>
          <v-card>
            <v-card-title>Rename Tag</v-card-title>
            <v-card-text>
              <v-row>
                <v-text-field label="Old Tag" v-model="oldTag"></v-text-field>
                <v-text-field label="New Tag" v-model="newTag"></v-text-field>
              </v-row>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click.native.stop="renameTags">Replace</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        <v-snackbar v-model="showSnackbar">
          {{snackbarMsg}}
        </v-snackbar>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import {DB} from "../db"
import { PaperData } from "@/paper_types"

@Component({components: {NavIcon}})
export default class Settings extends Vue {
  oldTag = ""
  newTag = ""
  showSnackbar = false
  snackbarMsg = ""

  /**
   * It's fine to rename to an existing tag; this just merges the tags.
   */
  async renameTags() {
    let metas = await DB.meta.toArray()
    if (!metas.length) {
      this.snackbarMsg = "No tags found!"
      this.showSnackbar = true
      return
    }
    if (metas.length > 1) {
      console.log("Warning: found multiple meta entries! Only using the first.")
      console.log(metas)
    }
    const meta = metas[0]
    const idx = meta.tags.indexOf(this.oldTag)
    if (idx == -1) {
      this.snackbarMsg = `Tag ${this.oldTag} not found!`
      this.showSnackbar = true
      return
    }
    meta.tags.splice(idx, 1)
    if (!meta.tags.includes(this.newTag)) {
      meta.tags.push(this.newTag)
    }
    meta._updateDb()
    const papers = await DB.papers.toArray()
    const modifiedPapers: PaperData[] = []
    for (let paper of papers) {
      if (paper.tags.includes(this.oldTag)) {
        if (paper.tags.includes(this.newTag)) {
          paper.tags.splice(paper.tags.indexOf(this.oldTag), 1)
        } else {
          paper.tags[paper.tags.indexOf(this.oldTag)] = this.newTag
        }
        modifiedPapers.push(paper)
      }
    }
    DB.papers.bulkPut(modifiedPapers)
    this.snackbarMsg = `Renamed ${this.oldTag} -> ${this.newTag} in ${modifiedPapers.length} papers.`
    this.oldTag = ""
    this.newTag = ""
    this.showSnackbar = true
  }
}
</script>

<style scoped lang="scss">
</style>

<template>
  <div id="notes">
    <v-app-bar app>
      <NavIcon/>
      <v-spacer></v-spacer>
      <v-btn v-if="!saving" icon @click.native.stop="savePaper">
        <v-icon>save</v-icon>
      </v-btn>
      <v-progress-circular v-else indeterminate></v-progress-circular>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col>
            <!-- ctrl.83 is ctrl+s; prevent stops it from saving the webpage -->
            <v-textarea autofocus v-model="text" @keydown.ctrl.83.prevent="savePaper"></v-textarea>
          </v-col>
          <v-col v-html="markdown"></v-col>
        </v-row>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import MarkdownIt from "markdown-it"
import {DB} from "../db"
import { PaperData } from "@/paper_types"

const MdRenderer = new MarkdownIt()
const autosave = true
let autosaveIntervalId: number | null = null

@Component({components: {NavIcon}})
export default class Notes extends Vue {
  text = ""
  paperId = this.$route.params["paperId"]
  paper!: PaperData
  saving = false

  async beforeMount() {
    const paper = await DB.papers.get(this.paperId)
    if (paper === undefined) {
      console.log(`Couldn't find paper with id ${this.paperId}!`)
      return
    }
    this.paper = paper
    this.text = paper.abstract
    if (autosave) {
      autosaveIntervalId = setInterval(() => {
        this.savePaper(false)
      }, 30_000)
    }
  }
  beforeDestroy() {
    if (autosaveIntervalId !== null) {
      clearInterval(autosaveIntervalId)
    }
  }
  async savePaper(showSaving=true) {
    if (showSaving) {
      this.saving = true
    }
    this.paper.abstract = this.text
    await DB.papers.put(this.paper)
    if (showSaving) {
      // Saving is actually very fast, but I want the user to see something indicating
      // the paper was saved, so delay a little to make the progress circle visible.
      setTimeout(() => {
        this.saving = false
      }, 300)
    }
  }
  get markdown() {
    return MdRenderer.render(this.text)
  }
}
</script>

<style scoped lang="scss">
</style>

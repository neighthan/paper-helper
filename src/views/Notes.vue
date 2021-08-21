<template>
  <div id="notes">
    <v-app-bar app height="48">
      <NavIcon/>
      <v-spacer></v-spacer>
      {{paper.title}}
      <v-spacer></v-spacer>
      <v-progress-circular v-if="saving" indeterminate></v-progress-circular>
      <v-btn v-else icon @click.native.stop="savePaper">
        <v-icon>save</v-icon>
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <MdText :paper="paper" @saveStart="saving = true" @saveEnd="saving = false"/>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import Markdown from "@/components/Markdown.vue"
import MdText from "@/components/MdText.vue"
import {DB} from "../db"
import { PaperData } from "@/paper_types"

@Component({components: {NavIcon, Markdown, MdText}})
export default class Notes extends Vue {
  paperId = this.$route.params["paperId"]
  paper = new PaperData() // filler until you get the real paper
  saving = false

  async created() {
    const paper = await DB.papers.get(this.paperId)
    if (paper === undefined) {
      console.log(`Couldn't find paper with id ${this.paperId}!`)
      return
    }
    this.paper = paper
  }
}
</script>

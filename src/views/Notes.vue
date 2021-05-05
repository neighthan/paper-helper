<template>
  <div id="notes">
    <v-app-bar app>
      <NavIcon/>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col>
            <v-textarea v-model="text"></v-textarea>
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

const MdRenderer = new MarkdownIt()

@Component({components: {NavIcon}})
export default class Notes extends Vue {
  text = ""

  get markdown() {
    return MdRenderer.render(this.text)
  }
}
</script>

<style scoped lang="scss">
</style>

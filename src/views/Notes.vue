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
            <v-textarea no-resize rows="20" ref="textarea" autofocus v-model="text"
              @keydown.ctrl.83.prevent="savePaper"
              @keydown.tab.prevent="tab"
            ></v-textarea>
          </v-col>
          <v-col>
            <div v-html="markdown" style="text-align: left">
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import {DB} from "../db"
import { PaperData } from "@/paper_types"
import {genId} from "../utils"
import {renderMarkdown, clearImgCache, getMarkdownForImg} from "../markdown"
import {loadMathjax} from "../mathjax"

const autosave = true
let autosaveIntervalId: number | null = null

loadMathjax(1000)

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
    const vue = this
    document.onpaste = function (event) {
      if (!event.clipboardData) return
      let items = event.clipboardData.items
      for (let item of items) {
        if (item.kind === 'file') {
          const blob = item.getAsFile()
          if (!blob) return
          const reader = new FileReader()
          reader.onload = function (event) {
            if (!event.target) return
            let dataUrl = event.target.result
            if (typeof(dataUrl) !== "string") return
            let id = genId()
            let success = vue.addTextAtCursor(getMarkdownForImg(id))
            if (success) {
              DB.imgs.add({id, dataUrl})
            }
          }
          reader.readAsDataURL(blob)
        }
      }
    }
  }
  beforeDestroy() {
    if (autosaveIntervalId !== null) {
      clearInterval(autosaveIntervalId)
    }
    // clearImgCache()
    document.onpaste = null
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
  tab() {
    this.addTextAtCursor("  ")
  }
  addTextAtCursor(text: string) {
    // TODO: remove <any> here (should check that this.$refs.textarea is the expected type else return false)
    const input = (<any> this.$refs.textarea).$refs.input
    let cursorPos = input.selectionEnd
    this.text =
        this.text.substring(0, cursorPos) +
        text +
        this.text.substring(cursorPos)
    cursorPos += text.length
    // Wait until vue finishes rendering the new text then update the cursor position
    this.$nextTick(() => input.setSelectionRange(cursorPos, cursorPos))
    return true
  }
  get markdown() {
    return renderMarkdown(this.text, () => {
      // This is just to make Vue re-render by making it think the text changed.
      // Is there a better method for this?
      let text = this.text
      this.text = ""
      this.text = text
    })
  }
}
</script>

<style scoped lang="scss">
</style>

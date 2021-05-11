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
            <v-textarea ref="textarea" autofocus v-model="text" @keydown.ctrl.83.prevent="savePaper"></v-textarea>
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
import MarkdownIt from "markdown-it"
import {DB} from "../db"
import { PaperData } from "@/paper_types"
import {genId} from "../utils"


const MdRenderer = new MarkdownIt({html: true, breaks: true})
const autosave = true
let autosaveIntervalId: number | null = null

@Component({components: {NavIcon}})
export default class Notes extends Vue {
  text = ""
  paperId = this.$route.params["paperId"]
  paper!: PaperData
  saving = false
  imgCache: {[key: string]: string} = {}

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
            let success = vue.addTextAtCursor(`<figure>\n  <img src=@"${id}">\n</figure>`)
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
    this.imgCache = {}
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
  processMdBeforeRender(md: string) {
    return md.replace(/<img src=@"(\w+)"/g, (fullMatch, id) => {
      if (!this.imgCache.hasOwnProperty(id)) {
        DB.imgs.get(id).then((img) => {
          if (img) {
            this.imgCache[id] = img.dataUrl
            // TODO: force a re-render? The image won't display until re-rendered.
            // If the user types something, that'll happen quickly, but if they don't,
            // they might be confused why the image isn't showing up.
          }
        })
      }
      return `<img src="${this.imgCache[id]}"`
    })
  }
  get markdown() {
    return MdRenderer.render(this.processMdBeforeRender(this.text))
  }
}
</script>

<style scoped lang="scss">
</style>

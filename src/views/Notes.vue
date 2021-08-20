<template>
  <div id="notes">
    <v-app-bar app height="48">
      <NavIcon/>
      <v-spacer></v-spacer>
      {{paper.title}}
      <v-spacer></v-spacer>
      <v-btn v-if="!saving" icon @click.native.stop="savePaper">
        <v-icon>save</v-icon>
      </v-btn>
      <v-progress-circular v-else indeterminate></v-progress-circular>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col v-if="textVisible" style="width: 50vh">
            <v-textarea no-resize ref="textarea" autofocus v-model="text" id="mdText"
              @keydown.ctrl.s.prevent="savePaper"
              @keydown.tab.prevent="tab"
              @keydown.ctrl.c.prevent="execCutCopy('copy')"
              @keydown.ctrl.x.prevent="execCutCopy('cut')"
            ></v-textarea>
          </v-col>
          <v-col v-if="renderVisible" style="width: 50vh">
            <Markdown :mdString="text"/>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator"
import NavIcon from "@/components/NavIcon.vue"
import Markdown from "@/components/Markdown.vue"
import {DB} from "../db"
import { PaperData } from "@/paper_types"
import {genId} from "../utils"
import {clearImgCache, getMarkdownForImg} from "../markdown"
import {loadMathjax} from "../mathjax"

const autosave = true
let autosaveIntervalId: number | null = null

loadMathjax(1000)

@Component({components: {NavIcon, Markdown}})
export default class Notes extends Vue {
  text = ""
  paperId = this.$route.params["paperId"]
  paper = new PaperData() // filler until real paper comes at created
  saving = false
  textVisible = true
  renderVisible = true

  async created() {
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
    document.addEventListener("keydown", this.toggleViews)
  }
  beforeDestroy() {
    if (autosaveIntervalId !== null) {
      clearInterval(autosaveIntervalId)
    }
    // clearImgCache()
    document.onpaste = null
    document.removeEventListener("keydown", this.toggleViews)
  }
  toggleViews(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === "[") {
      this.textVisible = !this.textVisible
    } else if (e.ctrlKey && e.key === "]") {
      this.renderVisible = !this.renderVisible
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
  tab() {
    this.addTextAtCursor("  ")
  }
  execCutCopy(cmd: string) {
    let start = this.textArea.selectionStart
    let end = this.textArea.selectionEnd
    if (start === end) { // cut the whole line
      let prevNewline = this.text.substring(0, start).lastIndexOf("\n")
      prevNewline = prevNewline === -1 ? 0 : prevNewline + 1
      let nextNewline = this.text.indexOf("\n", end)
      // +1 to include the newline char
      nextNewline = nextNewline === -1 ? this.text.length : nextNewline + 1
      this.textArea.setSelectionRange(prevNewline, nextNewline)
    }
    document.execCommand(cmd)
    if (cmd == "copy") {
      this.textArea.setSelectionRange(start, start)
    }
  }
  addTextAtCursor(text: string) {
    let cursorPos = this.textArea.selectionEnd
    this.text =
        this.text.substring(0, cursorPos) +
        text +
        this.text.substring(cursorPos)
    cursorPos += text.length
    // Wait until vue finishes rendering the new text then update the cursor position
    this.$nextTick(() => this.textArea.setSelectionRange(cursorPos, cursorPos))
    return true
  }
  get textArea() {
    return (<HTMLTextAreaElement> (<Vue> this.$refs.textarea).$refs.input)
  }
}
</script>

<style lang="scss">
html {
  overflow-y: hidden;
}
// using #mdText doesn't work because there's padding on one of the parent divs
// created around the textarea
.v-input {
  margin-top: 0px;
  padding-top: 0px;
}
#mdText {
  height: calc(97vh - 48px);
}
</style>

<template>
  <div id="renderedMd" v-html="markdown">
  </div>
</template>

<script lang="ts">
import {Component, Prop, Vue} from "vue-property-decorator"
import {renderMarkdown} from "../markdown"

@Component
export default class Markdown extends Vue {
  @Prop() private mdString!: string

  get markdown() {
    return renderMarkdown(this.mdString)
    // return renderMarkdown(this.mdString, () => {
      // This is just to make Vue re-render by making it think the text changed.
      // Is there a better method for this?
      // let text = this.text
      // this.text = ""
      // this.text = text
    // })
  }
}
</script>

<style lang="scss">
// css copied from https://markdown-it.github.io/
// todo: add table

#renderedMd {
  text-align: left;
  overflow-y: scroll;
  height: calc(97vh - 48px);
}

#renderedMd blockquote {
  padding: 10px 20px;
  margin: 0 0 20px;
  font-size: 17.5px;
  border-left: 5px solid #eee;
}

#renderedMd pre {
    display: block;
    padding: 9.5px;
    margin: 0 0 10px;
    font-size: 13px;
    line-height: 1.42857143;
    color: #333;
    word-break: break-all;
    word-wrap: break-word;
    background-color: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 4px;
}

#renderedMd pre code {
    padding: 0;
    font-size: inherit;
    color: inherit;
    white-space: pre-wrap;
    background-color: transparent;
    border-radius: 0;
}
</style>

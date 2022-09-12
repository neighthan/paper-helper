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
  imgCache: {[key: string]: string} = {}

  get markdown() {
    return renderMarkdown(this.mdString, this.imgCache)
  }
}
</script>

<style lang="scss">
@import "../../node_modules/highlight.js/styles/default.css";

// css copied from https://markdown-it.github.io/
// todo: see if this is available in node_modules so we don't need to
// copy-paste it
// todo: add table

#renderedMd {
  text-align: left;
  overflow-y: scroll;
  height: calc(97vh - 48px);
  word-wrap: break-word;
}

#renderedMd blockquote {
  padding: 5px 15px;
  margin: 0 0 10px;
  border-left: 5px solid #eee;
}

#renderedMd blockquote p {
  margin-bottom: 0px;
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

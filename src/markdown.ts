import hljs from "highlight.js"
import MarkdownIt from "markdown-it"
import MdFootnotes from "markdown-it-footnote"
import Vue from "vue"
import {loadImg} from "./backend/files"

const MdRenderer = new MarkdownIt({
  html: true,
  breaks: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, {language: lang}).value
      } catch {}
    }
    return ""
  }
})
MdRenderer.use(MdFootnotes)


function includeImgs(md: string, imgCache: {[key: string]: string}) {
  let unloadedIds: string[] = []
  md = md.replace(/<img src=@"(\w+)"/g, (fullMatch, id) => {
    if (!imgCache.hasOwnProperty(id)) {
      unloadedIds.push(id)
    }
    return `<img src="${imgCache[id]}"`
  })
  if (unloadedIds) {
    loadImgs(unloadedIds, imgCache)
  }
  return md
}

async function loadImgs(unloadedIds: string[], imgCache: {[key: string]: string}) {
  for (let id of unloadedIds) {
    // imgCache[id] = (await loadImg(id)) as any
    Vue.set(imgCache, id, await loadImg(id))
  }
}

function addMergeConflictStyling(md: string) {
  const lines = md.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith("!~")) {
      lines[i] = `<div style="color: red">${line.slice(2)}</div>`
    }
  }
  return lines.join("\n")
}


function processMdBeforeRender(md: string, imgCache: {[key: string]: string}) {
  md = includeImgs(md, imgCache)
  md = addMergeConflictStyling(md)
  // md = addCollapsers(md)
  return md
}

export function renderMarkdown(md: string, imgCache: {[key: string]: string}) {
  return MdRenderer.render(processMdBeforeRender(md, imgCache))
}

export function getMarkdownForImg(id: string) {
  return `<figure>\n  <img src=@"${id}">\n</figure>`
}

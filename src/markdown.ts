import hljs from "highlight.js"
import MarkdownIt from "markdown-it"
import MdFootnotes from "markdown-it-footnote"
import markdownItTocDoneRight from "markdown-it-toc-done-right"
import anchor from "markdown-it-anchor"
import {DB} from "./db"

const MdRenderer = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, {language: lang}).value
      } catch {}
    }
    return ""
  }
})
MdRenderer
  .use(MdFootnotes)
  .use(anchor)
  .use(markdownItTocDoneRight)
let imgCache: {[key: string]: string} = {}


// forceRerender can be used to make a component re-render once images are loaded
function includeImgs(md: string, callbacks: (() => void)[], forceRerender?: () => void) {
  let unloadedIds: string[] = []
  md = md.replace(/<img\s+?(([A-Za-z]+?="[^"]+?"\s*?)*?)\s*?src=@"(\w+?)"/g, (fullMatch, attrs, _, id) => {
    if (!imgCache.hasOwnProperty(id)) {
      unloadedIds.push(id)
    }
    return `<img ${attrs} src="${imgCache[id]}"`
  })
  if (unloadedIds.length) {
    DB.imgs.bulkGet(unloadedIds).then((imgs) => {
      let newImgLoaded = false
      for (let img of imgs) {
        if (!img) continue
        imgCache[img.id] = img.dataUrl
        newImgLoaded = true
      }
      if (newImgLoaded && forceRerender !== undefined) {
        forceRerender()
      }
    })
  }
  return md
}

function addMergeConflictStyling(md: string, callbacks: (() => void)[], forceRerender?: () => void) {
  const lines = md.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith("!~")) {
      lines[i] = `<div style="color: red">${line.slice(2)}</div>`
    }
  }
  return lines.join("\n")
}

function addTOCStyle(md: string, callbacks: (() => void)[], forceRerender?: () => void) {
  const style = `
<style>
  ol { counter-reset: list-item; }
  li { display: block; counter-increment: list-item; }
  li:before { content: counters(list-item,'.') ' '; }
</style>
`
  if (md.startsWith("[toc]")) {
    return style + md
  }
  return md
}

function addSideBySide(md: string, callbacks: (() => void)[], forceRerender?: () => void) {
  const START = "<@SS>"
  const END = "</SS>"
  const DIVIDER = "\n---\n"
  if (!md.includes(START)) {
    return md
  }

  const ssStyle = `<style>
    /* Style for the resizable container */
    .ss-container {
      height: 200px;
      overflow: hidden;
      resize: vertical;
      min-height: 50px;
      display: flex;
      justify-content: space-between;
    }

    /* Style for the resizable elements */
    .ss-element {
      width: 100%;
      height: 100%;
      overflow: scroll;
      overflow-x: hidden;
    }
  </style>` + "\n"

  function bindResizer() {
    // TS error when building the app if we just use new ResizeObserver
    // see https://stackoverflow.com/questions/60270925/finding-resizeobserver-with-typescript-in-angular-9
    // might be able to add custom types.
    const resizeObserver = new (window as any).ResizeObserver((entries: any[]) => {
      for (const entry of entries) {
        for (const child of (<Element> entry.target).children) {
          if ((<any> child).offsetHeight < child.scrollHeight) {
            ;(<any> child).style.overflowY = "visible"
          } else {
            ;(<any> child).style.overflowY = "hidden"
          }
        }
      }
    })
    for (const elem of document.getElementsByClassName("ss-container")) {
      resizeObserver.observe(elem)
    }
  }
  callbacks.push(bindResizer)

  const startIdxs = <number[]> [...md.matchAll(new RegExp(START, "gi"))].map(m => m.index)
  const endIdxs = <number[]> [...md.matchAll(new RegExp(END, "gi"))].map(m => m.index)

  // for each end, go up till you find the closest start, then pair.
  // if not matching number, still match the same way until you can't anymore (because
  // you're out of unmatched start or end idxs)
  const startEndIdxs = []
  for (const endIdx of endIdxs) {
    let closest = -1
    let idxClosest = -1
    for (const [i, startIdx] of startIdxs.entries()) {
      if (startIdx === -1) continue
      if (startIdx < endIdx && startIdx > closest) {
        closest = startIdx
        idxClosest = i
      }
    }
    if (closest !== -1) {
      startEndIdxs.push([closest, endIdx])
      startIdxs[idxClosest] = -1
    }
  }

  // for the splits, need to go from innermost to outermost...
  // so if you have
  /*
   * <@SS>
   * outer1
   * ----
   * <@SS>
   * inner1
   * ---
   * inner2
   * </SS>
   * </SS>
   */
  // then it should have 2 top-level ss-elements, one of which
  // is further split into two.
  // if we go in order by endIdx, this should work. startEndIdxs
  // is in the same order as endIdxs, so it should be sorted
  // properly already
  let newMd = "" // don't modify the original; messes up indices
  let mdStartIdx = 0
  for (const [i, [startIdx, endIdx]] of startEndIdxs.entries()) {
    let text = md.slice(startIdx + START.length, endIdx)
    let splits = text.split(DIVIDER)
    if (splits.length === 1) {
      text = splits[0]
    } else {
      splits = splits.map(s => `<div class="ss-element">${s}</div>`)
      text = `<div class="ss-container">${splits.join("\n")}</div>`
    }
    newMd += md.slice(mdStartIdx, startIdx) + "\n" + text + "\n"
    mdStartIdx = endIdx + END.length
  }
  newMd += md.slice(mdStartIdx)
  return ssStyle + newMd
}

function processMdBeforeRender(md: string, callbacks: (() => void)[], forceRerender?: () => void) {
  md = addTOCStyle(md, callbacks, forceRerender)
  md = addSideBySide(md, callbacks, forceRerender)
  md = includeImgs(md, callbacks, forceRerender)
  md = addMergeConflictStyling(md, callbacks, forceRerender)
  // md = addCollapsers(md)
  return md
}

export function renderMarkdown(md: string, forceRerender?: () => void) {
  const callbacks: (() => void)[] = []
  const html = MdRenderer.render(processMdBeforeRender(md, callbacks, forceRerender))
  return {html, callbacks}
}

export function clearImgCache() {
  imgCache = {}
}

export function getMarkdownForImg(id: string) {
  return `<figure>\n  <img src=@"${id}">\n</figure>`
}

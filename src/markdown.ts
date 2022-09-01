import hljs from "highlight.js"
import MarkdownIt from "markdown-it"
import MdFootnotes from "markdown-it-footnote"

const DB: any = 0

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
let imgCache: {[key: string]: string} = {}


// callback can be used to make a component re-render once images are loaded
function includeImgs(md: string, callback?: any) {
  let unloadedIds: string[] = []
  md = md.replace(/<img src=@"(\w+)"/g, (fullMatch, id) => {
    if (!imgCache.hasOwnProperty(id)) {
      unloadedIds.push(id)
    }
    return `<img src="${imgCache[id]}"`
  })
  if (unloadedIds) {
    DB.imgs.bulkGet(unloadedIds).then((imgs: any) => {
      let newImgLoaded = false
      for (let img of imgs) {
        if (!img) continue
        imgCache[img.id] = img.dataUrl
        newImgLoaded = true
      }
      if (newImgLoaded && callback !== undefined) {
        callback()
      }
    })
  }
  return md
}

function addMergeConflictStyling(md: string, callback?: any) {
  const lines = md.split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith("!~")) {
      lines[i] = `<div style="color: red">${line.slice(2)}</div>`
    }
  }
  return lines.join("\n")
}


function processMdBeforeRender(md: string, callback?: any) {
  md = includeImgs(md, callback)
  md = addMergeConflictStyling(md, callback)
  // md = addCollapsers(md)
  return md
}

export function renderMarkdown(md: string, callback?: any) {
  return MdRenderer.render(processMdBeforeRender(md, callback))
}

export function clearImgCache() {
  imgCache = {}
}

export function getMarkdownForImg(id: string) {
  return `<figure>\n  <img src=@"${id}">\n</figure>`
}

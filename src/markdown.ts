import MarkdownIt from "markdown-it"
import MdFootnotes from "markdown-it-footnote"
import {DB} from "./db"

const MdRenderer = new MarkdownIt({html: true, breaks: true})
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
    DB.imgs.bulkGet(unloadedIds).then((imgs) => {
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


function processMdBeforeRender(md: string, callback?: any) {
  md = includeImgs(md, callback)
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

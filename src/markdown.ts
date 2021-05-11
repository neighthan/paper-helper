import MarkdownIt from "markdown-it"
import {DB} from "./db"

const MdRenderer = new MarkdownIt({html: true, breaks: true})
let imgCache: {[key: string]: string} = {}


function processMdBeforeRender(md: string) {
  return md.replace(/<img src=@"(\w+)"/g, (fullMatch, id) => {
    if (!imgCache.hasOwnProperty(id)) {
      DB.imgs.get(id).then((img) => {
        if (img) {
          imgCache[id] = img.dataUrl
          // TODO: force a re-render? The image won't display until re-rendered.
          // If the user types something, that'll happen quickly, but if they don't,
          // they might be confused why the image isn't showing up.
        }
      })
    }
    return `<img src="${imgCache[id]}"`
  })
}

export function renderMarkdown(md: string) {
  return MdRenderer.render(processMdBeforeRender(md))
}

export function clearImgCache() {
  imgCache = {}
}

export function getMarkdownForImg(id: string) {
  return `<figure>\n  <img src=@"${id}">\n</figure>`
}

import { PaperData } from "./paper_types"

export function genId() {
  return Date.now().toString(16) + Math.random().toString(16).substr(2)
}

export async function getPaperFromArxiv(url: string) {
  const data = new PaperData()
  // should be https://arxiv.org/abs/<id> or https://arxiv.org/pdf/<id>.pdf
  const id = url.split("/").pop()?.replace(".pdf", "")
  data.url = `https://arxiv.org/abs/${id}` // always use abstract url, not pdf
  const response = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`)
  if (!response.ok) {
    // snackbar w/ error message?
    throw new Error(response.statusText);
  }
  const xml = await response.text()
  let match = xml.match(/<title>(.*?)<\/title>/s)
  data.title = match?.length == 2 ? match[1] : ""
  match = xml.match(/<summary>(.*?)<\/summary>/s)
  if (match?.length == 2) {
    data.abstract = match[1].replaceAll("\n", " ").trim()
  }
  match = xml.match(/<published>(.*?)<\/published>/s)
  if (match?.length == 2) {
    data.date = match[1].split("T")[0].replaceAll("-", "/")
  }
  let matches = xml.matchAll(/<name>(.*?)<\/name>/gs)
  data.authors = Array(...matches).map(m => m[1])
  data.tags.push("paper")
  return data
}

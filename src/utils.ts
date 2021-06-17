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

/**
 * @returns default PaperData if there's an error.
 */
export async function getDataFromYouTube(url: string) {
  const data = new PaperData()
  const apiKey = "AIzaSyAqYAFG23NRZbHT3QhrkvAX7AX0PWP8dJE"
  const match = url.match(/\?v=([^&]+)/)
  if (match === null) return data
  const videoID = match[1]
  const requestURL = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&fields=items(snippet(title, description, publishedAt, channelTitle, tags, thumbnails/standard/url), contentDetails/duration)&id=${videoID}&key=${apiKey}`
  const response = await fetch(requestURL)
  const json = await response.json()
  if (json.items === undefined || json.items.length === 0) return data
  const videoData = json.items[0]
  data.title = videoData.snippet.title
  data.authors.push(videoData.snippet.channelTitle)
  data.date = videoData.snippet.publishedAt.split("T")[0]
  data.tags = videoData.snippet.tags
  data.tags.push("watch")
  const duration = videoData.contentDetails.duration.replace("PT", "")
  data.abstract = `Duration ${duration}\n![video thumbnail](${videoData.snippet.thumbnails.standard.url})\n\n${videoData.snippet.description}`
  return data
}

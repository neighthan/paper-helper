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
  data.url = url
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
  data.tags = videoData.snippet.tags ?? []
  data.tags.push("watch")
  const duration = videoData.contentDetails.duration.replace("PT", "")
  const thumbnail = videoData.snippet.thumbnails.standard
  // TODO: try to use other thumbnails if standard isn't found
  const thumbnailMd = thumbnail !== undefined ? `\n![video thumbnail](${thumbnail.url})` : ""
  data.abstract = `Duration ${duration}${thumbnailMd}\n\n${videoData.snippet.description}`
  return data
}

/**
 * Merge two strings by adding all lines from `modifiedText` which aren't in `mainText`
 * to `mainText`.
 * Each line from `modifiedText` has `prefix` prepended to it.
 */
export function mergeTexts(mainText: string, modifiedText: string, prefix: string="") {
  let merged: string[] = []
  let lines1 = mainText.split("\n")
  let lines2 = modifiedText.split("\n")
  while (lines1.length || lines2.length) {
    if (!lines1.length) {
      for (const line of lines2) {
        merged.push(prefix + line)
      }
      break
    }
    if (!lines2.length) {
      merged.push(...lines1)
      break
    }

    const line1 = lines1[0]
    const line2 = lines2[0]
    if (line1 === line2) {
      merged.push(line1)
      lines1.shift()
      lines2.shift()
    } else {
      if (lines2.includes(line1)) {
        merged.push(prefix + line2)
        lines2.shift()
      } else {
        merged.push(line1)
        lines1.shift()
      }
    }
  }
  return merged.join("\n")
}

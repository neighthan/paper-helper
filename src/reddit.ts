import {DB, getMeta} from "./db"
import snoowrap from "snoowrap"
import {getPaperFromArxiv} from "@/utils"
import { PaperData } from "@/entries/papers/paper"

function isSubmission(obj: any): obj is snoowrap.Submission {
  return obj.title !== undefined
}

async function getRedditInfo() {
  const meta = await getMeta(DB)
  return meta.redditInfo
}

/**
 * save userAgent, clientId, clientSecret, and username in meta. prompt for password each time
 * (prompt for the others if they're not present in meta, i.e. if they're "")
 */
export default async function getAllSavedPosts(password: string) {
  const subreddits = ["r/MachineLearning", "r/reinforcementlearning"]
  const redditInfo = (<snoowrap.SnoowrapOptions> await getRedditInfo())
  redditInfo.password = password
  const r = new snoowrap(redditInfo)

  let posts
  try {
    posts = await r.getMe().getSavedContent()
  } catch (error) {
    return "Error authenticating to Reddit! Check Reddit info and password."
  }
  // You only get the first ~20 saved things by default. Use fetchAll on the listing to
  // get everything. The type hints seem to be messed up here, though; fetchAll returns
  // a promise
  posts = await (<Promise<snoowrap.Listing<snoowrap.Comment | snoowrap.Submission>>> (<any> posts.fetchAll()))
  let nPapersAdded = 0
  for (let post of posts) {
    if (!subreddits.includes(post.subreddit_name_prefixed)) continue
    if (!isSubmission(post)) continue

    let data: PaperData
    const redditURL = `https://www.reddit.com/${post.permalink}`
    if (post.domain === "arxiv.org") {
      data = await getPaperFromArxiv(post.url)
      data.notes = `[Reddit page]\n${post.selftext}\nArxiv abstract:\n${data.notes}\n\n[Reddit page]: ${redditURL}`
      data.tags.push("reddit")
      data.tags.push("ml")
    } else {
      const date = new Date(post.created_utc * 1000)
      data = new PaperData()
      data.title = post.title
      data.notes = post.selftext
      data.tags = ["reddit", "ml"]
      data.date = date.toISOString().split("T")[0]
      data.url = redditURL
    }
    DB.papers.add(data).then(() => {
      post.unsave()
    })
    nPapersAdded += 1
  }
  const msg = `Added ${nPapersAdded} papers of ${posts.length} initial saved entries.`
  return msg
}

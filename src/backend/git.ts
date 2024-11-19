/*
I can't find a good way in isomorphic-git to get the list of files that were modified in
the previous commit. There's `git.listFiles`, but that lists all files at the time of
the commit, whether they were modified or not. So I'm storing the modified files in the
commit message
*/

import git, { ReadCommitResult, Errors } from 'isomorphic-git'
import http from 'isomorphic-git/http/web/index.js'
import {CFS, fromMarkdown, FS, readEntryFile, readFile, writeEntryFile} from "@/backend/files"

const GIT_DIR = "/"
const TMP_BRANCH_NAME = "tmp"

interface SimpleCommit {
  oid: string
  timestamp: number
  contents: string
}

async function gitAdd(filepath: string) {
  await git.add({fs: CFS, filepath: relativize(filepath), dir: GIT_DIR})
}

async function gitCommit(message?: string) {
  // TODO: it seems like it will even do empy commits? Check if there are changes first
  // and only commit if so.
  await git.commit({fs: CFS, message: message ?? "", dir: GIT_DIR})
}

async function gitRm(filepath: string) {
  await git.remove({fs: CFS, filepath: relativize(filepath), dir: GIT_DIR})
}

async function gitSetup() {
  await gitClone()
  await git.setConfig({fs: CFS, dir: GIT_DIR, path: "user.name", value: "note-taker"})
}

async function getCommitHistory(filepath: string): Promise<SimpleCommit[]> {
  filepath = relativize(filepath)
  const commits = await git.log({fs: CFS, dir: GIT_DIR, filepath: filepath})
  return commits.map(c => ({oid: c.oid, timestamp: c.commit.committer.timestamp * 1000, contents: ""}))
}

async function readFileAtCommit(filepath: string, oid: string) {
  const {blob} = await git.readBlob({
    fs: CFS,
    dir: GIT_DIR,
    oid: oid,
    filepath: relativize(filepath),
  })
  return new TextDecoder().decode(blob)
}


/**
 * Commits if the most recent commit wasn't today or if there were no commits yet.
 */
async function gitCommitIfNewDay(message?: string) {
  let prevCommits: ReadCommitResult[] = []
  try { // fails if no commits yet
    prevCommits = await git.log({fs: CFS, dir: GIT_DIR, depth: 1})
  } catch(e) {
    if (!(e instanceof Error && e.message.startsWith("Could not find refs/heads/master"))) {
      throw e
    }
  }
  if (prevCommits.length === 0) {
    return gitCommit(message)
  }
  const prevCommit = prevCommits[0].commit
  // timezoneOffset is in minutes and timestamp in seconds, so have to convert to ms
  const prevDate = new Date(
    (prevCommit.committer.timestamp + prevCommit.committer.timezoneOffset * 60) * 1000
  )
  if (!wasToday(prevDate)) {
    console.log(`New day! Committing. (prev date: ${prevDate}`)
    return gitCommit(message)
  }
}

async function gitPush() {
  const o = {
    fs: CFS,
    http,
    dir: GIT_DIR,
    corsProxy: getSavedKey("corsProxy"),
    url: getAuthUrl(),
    // author: {
      // name: "me",
      // email: "me@com"
    // }
  }
  await git.push(o)
}

async function gitPull(toTmpBranch: boolean = false) {
  const o = {
    fs: CFS,
    http,
    dir: GIT_DIR,
    ref: toTmpBranch? TMP_BRANCH_NAME : "master",
    corsProxy: getSavedKey("corsProxy"),
    url: getAuthUrl(),
    singleBranch: true,
    // author: {
      // name: "me",
      // email: "me@com"
    // }
  }
  await git.pull(o)
}

async function gitClone() {
  return git.clone({
    fs: CFS,
    http,
    dir: GIT_DIR,
    corsProxy: getSavedKey("corsProxy"),
    url: getAuthUrl(),
  })
}

async function gitMerge() {
  await git.fetch({
    fs: CFS,
    http,
    dir: GIT_DIR,
    corsProxy: getSavedKey("corsProxy"),
    url: getAuthUrl(),
    singleBranch: true,
    ref: "master",
  })

  try {
    await git.merge({
      fs: CFS,
      dir: GIT_DIR,
      ours: "master",
      theirs: "remotes/origin/master",
      abortOnConflict: false,
    })
  } catch (err) {
    if (err instanceof Errors.MergeConflictError) {
      localStorage.setItem("merging", "true")
      console.log(err.data.filepaths)
      for (const fpath of err.data.filepaths) {
        const entry = fromMarkdown(await readFile(`/${fpath}`))
        entry.tags.push("merge-conflict")
        await writeEntryFile(entry)
      }
      return err.data.filepaths
    } else throw err
  }
  return []
}

async function gitFinalizeMerge() {
  // TODO: what files to add? Should be only those that
  // were modified. Maybe save that to localStorage from
  // err.data above?
  // These will probably already be staged because when the user saves a file,
  // it's added to the index. But if they just want to finalize the merge
  // without fixing all the conflicts (leaving the conflict markers in), then
  // they won't have saved the files, so we may need to add them explicitly.
  // Oh, what if we just add them all in gitMerge? Then if the user goes to
  // fix them, they'll just be added again, but if not, we have them already.
  // So we wouldn't need an add here, just commit and delete the tmp branch.

  // or.. if any changed files are always added anyway, then adding all files is
  // fine, so we can jukst do git add . here and it should take care of the merge
  // conflict files too if they weren't added yet.
  await git.add({
    fs: CFS,
    dir: GIT_DIR,
    filepath: '.',
  })

  await git.commit({
    fs: CFS,
    dir: GIT_DIR,
    // ref: 'main',
    message: "Merge Github into local.",
    parent: ["master", "remotes/origin/master"],
  })

  await gitPush()
  localStorage.setItem("merging", "false")
}

/**
 * Check if `today` was some time today (true if so, false if not).
 */
function wasToday(today: Date) {
  const date = new Date()
  return (
    date.getDate() === today.getDate()
    && date.getMonth() === today.getMonth()
    && date.getFullYear() === today.getFullYear()
  )
}

function relativize(path: string) {
  // needs to be relative to GIT_DIR
  return path.startsWith(GIT_DIR) ? path.slice(GIT_DIR.length) : path
}

function getAuthUrl () {
  const username = getSavedKey("username")
  const repoName = getSavedKey("repoName")
  const url = new URL(`https://github.com/${username}/${repoName}`)
  url.username = username
  url.password = getSavedKey("oauthToken")
  return url.toString()
}

function getSavedKey(name: string): string {
  let value = localStorage.getItem(name)
  if (value === null) {
    value = prompt(`Enter a value for ${name}:`)
    if (value === null) {
      throw new Error(`No value given for ${name}`)
    }
    localStorage.setItem(name, value)
  }
  return value
}

export {gitAdd, gitCommit, gitCommitIfNewDay, gitRm, gitSetup, getCommitHistory, readFileAtCommit, SimpleCommit, gitPush, gitPull, gitClone, gitMerge, gitFinalizeMerge}

/*
I can't find a good way in isomorphic-git to get the list of files that were modified in
the previous commit. There's `git.listFiles`, but that lists all files at the time of
the commit, whether they were modified or not. So I'm storing the modified files in the
commit message
*/

import git, { ReadCommitResult } from 'isomorphic-git'
import {CFS, FS} from "@/backend/files"

const GIT_DIR = "/"

async function gitAdd(filepath: string) {
  await git.add({fs: CFS, filepath: relativize(filepath), dir: GIT_DIR})
}

async function gitCommit(message?: string) {
  await git.commit({fs: CFS, message: message ?? "", dir: GIT_DIR})
}

async function gitRm(filepath: string) {
  await git.remove({fs: CFS, filepath: relativize(filepath), dir: GIT_DIR})
}

async function gitInit() {
  await git.init({fs: CFS, dir: GIT_DIR})
  await git.setConfig({fs: CFS, dir: GIT_DIR, path: "user.name", value: "note-taker"})
}

async function getCommitHistory(filepath: string) {
  filepath = relativize(filepath)
  const commits = await git.log({fs: CFS, dir: GIT_DIR, filepath: filepath})
  return commits.map(c => ({oid: c.oid, timestamp: c.commit.committer.timestamp * 1000}))
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
  // timezoneOffset is in minutes, so have to convert to ms
  const prevDate = new Date(
    prevCommit.committer.timestamp + prevCommit.committer.timezoneOffset * 60 * 1000
  )
  if (!wasToday(prevDate)) {
    return gitCommit(message)
  }
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
  return path.startsWith("/") ? path.slice(1) : path
}

export {gitAdd, gitCommit, gitCommitIfNewDay, gitRm, gitInit, getCommitHistory, readFileAtCommit}

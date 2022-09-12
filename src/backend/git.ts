/*
I can't find a good way in isomorphic-git to get the list of files that were modified in
the previous commit. There's `git.listFiles`, but that lists all files at the time of
the commit, whether they were modified or not. So I'm storing the modified files in the
commit message
*/

import git from 'isomorphic-git'
import {CFS, FS} from "@/backend/files"

const GIT_DIR = "/"
const HARD = "hard"

async function gitCommitAutoAmend(filepath: string) {
  const prevCommits = await git.log({fs: CFS, dir: GIT_DIR, depth: 2})
  if (prevCommits.length === 0) {
    return gitCommitSoft(filepath)
  }
  const prevCommit = prevCommits[0].commit

  const prevMsg = prevCommit.message
  if (prevMsg === HARD) {
    return gitCommitSoft(filepath)
  }

  // timezoneOffset is in minutes, so have to convert to ms
  const prevDate = new Date(
    prevCommit.committer.timestamp + prevCommit.committer.timezoneOffset * 60 * 1000
  )
  if (checkYesterday(prevDate)) {
    return gitCommitSoft(filepath)
  }

  return gitCommitAmend(filepath)
}

async function gitCommit(filepath: string, message: string) {
  await git.add({fs: CFS, filepath: relativize(filepath), dir: GIT_DIR})
  await git.commit({fs: CFS, message, dir: GIT_DIR})
}

/**
 * A "hard" commit is one that can't be amended later.
 */
async function gitCommitHard(filepath: string) {
  return gitCommit(filepath, HARD)
}

/**
 * A "soft" commit is one that can be amended later (possibly subject to time
 * restrictions).
 */
 async function gitCommitSoft(filepath: string) {
  filepath = relativize(filepath)
  return gitCommit(filepath, filepath)
}

async function gitCommitAmend(filepath: string) {
  filepath = relativize(filepath)

  // apparently git commit --amend isn't implemented yet
  // https://github.com/isomorphic-git/isomorphic-git/issues/729
  // so need to do a custom version of this. First reset, then add all modified files
  // (no git add --all either) then commit

  const prevCommits = await git.log({fs: CFS, dir: GIT_DIR, depth: 2})
  if (prevCommits.length < 2) {
    // need 2 prev commits because we "reset" by going to the commit before HEAD.
    // A proper git commit --amend would just need 1 prev commit.
    console.error("Can't amend commit without >=2 previous commits.")
    return gitCommitSoft(filepath)
  }
  const files = prevCommits[0].commit.message.split("\n")
  files.push(filepath)

  await gitReset()
  await git.add({fs: CFS, filepath: files as any, dir: GIT_DIR})
  await git.commit({fs: CFS, message: files.join("\n"), dir: GIT_DIR})
}

// https://github.com/isomorphic-git/isomorphic-git/issues/729#issuecomment-510704574
async function gitReset({hard = false}: {hard?: boolean} = {}) {
  const branch = "master"
  const commits = await git.log({fs: CFS, dir: GIT_DIR, depth: 2})
  if (commits.length < 2) { throw new Error("Not enough commits") }
  const commit = commits[commits.length - 1].oid
  await FS.writeFile(`${GIT_DIR}/.git/refs/heads/${branch}`, (commit + '\n' as any))
  if (!hard) { return }
  // clear the index (if any)
  await FS.unlink(`${GIT_DIR}/.git/index`)
  // checkout the branch into the working tree
  await git.checkout({fs: CFS, dir: GIT_DIR, ref: branch})
}

async function gitRm(filepath: string) {
  filepath = relativize(filepath)
  await git.remove({fs: CFS, filepath, dir: GIT_DIR})
  await git.commit({fs: CFS, message: `Delete ${filepath}.`, dir: GIT_DIR})
}

async function gitInit() {
  await git.init({fs: CFS, dir: GIT_DIR})
  await git.setConfig({fs: CFS, dir: GIT_DIR, path: "user.name", value: "note-taker"})
}

/**
 * Check if `yesterday` was some time yesterday (true if so, false if not).
 */
function checkYesterday(yesterday: Date) {
  const date = new Date()
  // zero out the hours, minutes, seconds, and milliseconds
  date.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)
  const msInDay = 24 * 60 * 60 * 1000
  return date.getTime() - msInDay == yesterday.getTime()
}

function relativize(path: string) {
  // needs to be relative to GIT_DIR
  return path.startsWith("/") ? path.slice(1) : path
}

export {gitCommitAutoAmend, gitCommitHard, gitRm, gitInit}

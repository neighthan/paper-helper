import git from 'isomorphic-git'
import {CFS} from "@/backend/files"

const GIT_DIR = "/"

// TODO: if most recent commit is "autosave <file>" and it matches the current file,
// then amend that commit instead of making a new one
async function gitCommit(filepath: string) {
  if (filepath.startsWith("/")) {
    // needs to be relative to GIT_DIR
    filepath = filepath.slice(1)
  }
  await git.add({fs: CFS, filepath, dir: GIT_DIR})
  await git.commit({fs: CFS, message: `Save ${filepath}.`, dir: GIT_DIR})
}

async function gitRm(filepath: string) {
  if (filepath.startsWith("/")) {
    // needs to be relative to GIT_DIR
    filepath = filepath.slice(1)
  }
  await git.remove({fs: CFS, filepath, dir: GIT_DIR})
  await git.commit({fs: CFS, message: `Delete ${filepath}.`, dir: GIT_DIR})
}

async function gitInit() {
  await git.init({fs: CFS, dir: GIT_DIR})
  await git.setConfig({fs: CFS, dir: GIT_DIR, path: "user.name", value: "note-taker"})
}

export {gitCommit, gitRm, gitInit}

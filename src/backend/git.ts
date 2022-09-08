import git from 'isomorphic-git'
import {FS} from "@/backend/files"


// if most recent commit is "autosave <file>" and it matches the current file,
// then amend that commit instead of making a new one
async function gitCommit(dir: string, fname: string) {
  await git.add({fs: FS, dir: dir, filepath: fname})
  await git.commit({fs: FS, message: `Save ${fname}.`})
}

async function gitRm(dir: string, fname: string) {
  await git.remove({fs: FS, dir, filepath: fname})
  await git.commit({fs: FS, message: `Delete ${fname}.`})
}

export {gitCommit, gitRm}

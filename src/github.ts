import { Errors } from "isomorphic-git"

import { gitPull, gitPush, gitMerge, gitFinalizeMerge } from "./backend/git"

async function syncGithub() {
  if (localStorage.getItem("merging") === "true") {
    await gitFinalizeMerge()
    localStorage.setItem("merging", "false")
    return {msg: "Completed merge commit and syncing.", success: true}
  }

  try {
    await gitPush()
    return {msg: "Sync complete.", success: true}
  } catch (err: any)  {
    if (!(err instanceof Errors.PushRejectedError)) {
      throw err
    }
  }

  // push rejected so need to merge remote commits first
  try { // try simple pull and auto-merge
    await gitPull()
    return {msg: "Sync complete.", success: true}
  } catch (err: any) {
    if (!(err instanceof Errors.MergeConflictError)) {
      throw err
    }
  }

  // have to do a manual merge
  const conflictFiles = await gitMerge()
  if (conflictFiles.length === 0) {
    await gitPush()
    return {msg: "Sync complete.", success: true}
  }

  return {msg:`${conflictFiles.length} files with conflicts. Fix then finish merging.`, success: false}
}

export {syncGithub}

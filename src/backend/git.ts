import git from 'isomorphic-git'


// if most recent commit is "autosave <file>" and it matches the current file,
// then amend that commit instead of making a new one
async function gitCommit(file: string) {

}

async function gitRm(file: string) {

}

export {gitCommit, gitRm}

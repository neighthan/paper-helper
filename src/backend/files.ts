import LightningFS from '@isomorphic-git/lightning-fs'
import { gitCommit, gitRm } from './git'

const FS_NAME = "notes"
const FS = new LightningFS(FS_NAME).promises

interface HasID {
  id: string
  content?: string
  [etc: string]: any
}

function joinPath(...segments: string[]) {
  return segments.join("/")
}

async function readFile(filePath: string): Promise<string> {
  return await FS.readFile(filePath, {encoding: "utf8"}) as unknown as string
}

async function writeFile(filePath: string, contents: string) {
  let i = 0
  while (true) {
    i = filePath.indexOf("/", i + 1)
    if (i === -1) {
      break
    }
    try {
      await FS.mkdir(filePath.slice(0, i))
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("EEXIST")) {
        continue
      }
      throw e
    }
  }
  await FS.writeFile(filePath, contents as any, {encoding: "utf8", mode: 0o777})
}

async function loadFiles(query: any) {

}

async function importFiles(files: any) {

}

async function exportFiles() {
  return "" as any
}

function wipeAllFiles() {
  FS.init(FS_NAME, {wipe: true} as any)
}

function getEntryDir(entry: HasID) {
  const cName = entry.constructor.name
  if (cName === "SavedQuery") {
    return `/${cName}`
  }
  return `/entries/${cName}`
}

function getEntryPath(entry: HasID) {
  return `${getEntryDir(entry)}/${entry.id}.md`
}

function toMarkdown(entry: HasID) {
  const header = []
  for (let [key, value] of Object.entries(entry)) {
    if (key === "content") continue
    header.push(`${key} = ${JSON.stringify(value)}`)
  }
  const md = `---\n${header.join("\n")}\n---\n\n${entry.content ?? ""}`
  return md
}

/**
 * @param md must be formatted like
 * ---
 * <key> = <value>
 * ...
 * ---
 *
 * <content>
 */
function fromMarkdown(md: string) {
  if (!md.startsWith("---\n")) {
    throw Error(`Invalid markdown; expected to start with '---\\n'.\n${md}`)
  }
  md = md.slice(4)
  if (!md.includes("\n---")) {
    throw Error(`Invalid markdown; expected to contain '\\n---'.\n${md}`)
  }
  let [header, content] = md.split("\n---", 1)
  const entry: HasID = {id: ""}
  for (const line of header.split("\n")) {
    const [key, value] = line.split(" = ")
    entry[key] = JSON.parse(value)
  }
  if (entry.id === "") {
    throw Error(`No ID found!\n${md}`)
  }
  content = (content ?? "").trim()
  if (content !== "") {
    entry["content"] = content
  }
  return entry
}

async function writeEntryFile(entry: HasID) {
  const path = getEntryPath(entry)
  await writeFile(path, toMarkdown(entry))
  await gitCommit(path)
}

async function deleteEntryFile(entry: HasID) {
  const path = getEntryPath(entry)
  await FS.unlink(path)
  await gitRm(path)
}

export {
  FS,
  joinPath,
  readFile,
  writeFile,
  importFiles,
  exportFiles,
  loadFiles,
  wipeAllFiles,
  writeEntryFile,
  deleteEntryFile,
  getEntryDir,
  getEntryPath,
  toMarkdown,
  fromMarkdown,
}

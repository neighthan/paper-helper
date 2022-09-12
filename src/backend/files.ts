import { getEntryTypes } from '@/entries/entries'
import { Entry } from '@/entries/entry'
import LightningFS from '@isomorphic-git/lightning-fs'
import { gitCommit, gitInit, gitRm } from './git'

const FS_NAME = "notes"
const CFS = new LightningFS(FS_NAME)
const FS = CFS.promises
const IMG_DIR = "/imgs"

function joinPath(...segments: string[]) {
  return segments.join("/")
}

async function readFile(filePath: string): Promise<string> {
  return await FS.readFile(filePath, {encoding: "utf8"}) as unknown as string
}

async function writeFile(filePath: string, contents: string) {
  await FS.writeFile(filePath, contents as any, {encoding: "utf8", mode: 0o777})
}

async function writeFileAndDirs(filePath: string, contents: string) {
  let i = 0
  while (true) {
    i = filePath.indexOf("/", i + 1)
    if (i === -1) {
      break
    }
    await mkdir(filePath.slice(0, i))
  }
  await FS.writeFile(filePath, contents as any, {encoding: "utf8", mode: 0o777})
}

async function mkdir(path: string) {
  try {
    await FS.mkdir(path)
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("EEXIST")) {
      return
    }
    throw e
  }
}


async function importFiles(files: any) {

}

async function exportFiles() {
  return "" as any
}

function wipeAllFiles() {
  FS.init(FS_NAME, {wipe: true} as any)
}

function getEntryDir(entry: Entry) {
  return joinPath("/entries", entry.constructor.name)
}

function getEntryFname(entry: Entry) {
  return `${entry.id}.md`
}

function getEntryPath(entry: Entry) {
  return joinPath(getEntryDir(entry), getEntryFname(entry))
}

function toMarkdown(entry: Entry) {
  const header = []
  for (const [key, value] of Object.entries(entry)) {
    if (key === "content") continue
    if (key === "extraParams") {
      for (const [extraKey, extraValue] of Object.entries(value)) {
        header.push(`${extraKey} = ${JSON.stringify(extraValue)}`)
      }
    } else {
      header.push(`${key} = ${JSON.stringify(value)}`)
    }
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
  if (!md.slice(4).includes("\n---")) {
    throw Error(`Invalid markdown; expected to contain '\\n---'.\n${md}`)
  }
  let [header, content] = md.slice(4).split("\n---", 2)
  const entryData: {[key: string]: any} = {}
  for (const line of header.split("\n")) {
    const [key, value] = line.split(" = ")
    entryData[key] = JSON.parse(value)
  }
  if (entryData.id === undefined) {
    throw Error(`No ID found!\n${md}`)
  }
  content = (content ?? "").trim()
  if (content !== "") {
    entryData["content"] = content
  }
  const EntryTypes = getEntryTypes()
  const entryClass = entryData.entryClass
  delete entryData.entryClass
  const entry = new EntryTypes[entryClass as keyof typeof EntryTypes].ctor(entryData as any)
  if (md !== toMarkdown(entry)) {
    console.error("fromMarkdown and toMarkdown not giving same results")
    console.error(md)
    console.error(toMarkdown(entry))
  }
  return entry
}

async function readEntryFile(entryClass: string, entryId: string) {
  console.log(`Trying to read a ${entryClass} with id ${entryId}`)
  if (!entryId.endsWith(".md")) {
    entryId = `${entryId}.md`
  }
  const path = joinPath("/entries", entryClass, entryId)
  const md = await readFile(path)
  console.log(md)
  return fromMarkdown(md)
}

async function readAllEntries(entryClass: string) {
  const ids = await FS.readdir(joinPath("/entries", entryClass))
  const entries = []
  for (const id of ids) {
    entries.push(await readEntryFile(entryClass, id))
  }
  return entries
}

async function writeEntryFile(entry: Entry) {
  const path = getEntryPath(entry)
  await writeFile(path, toMarkdown(entry))
  await gitCommit(path)
}

async function deleteEntryFile(entry: Entry) {
  const path = getEntryPath(entry)
  await FS.unlink(path)
  await gitRm(path)
}

async function loadImg(id: string) {
  return await readFile(joinPath(IMG_DIR, id))
}

async function saveImg(id: string, dataUrl: string) {
  return await writeFile(joinPath(IMG_DIR, id), dataUrl)
}

async function setupDirs() {
  const promises = [
    mkdir("/entries"),
    mkdir("/entries/ToDo"),
    mkdir("/entries/Paper"),
    mkdir("/entries/SavedQuery"),
    gitInit(),
  ]
  return Promise.all(promises)
  // for (let EntryType of Object.values(EntryTypes)) {
    // await FS.mkdir(joinPath("/entries", EntryType.ctor.name))
  // }
}

export {
  FS,
  CFS,
  joinPath,
  readFile,
  writeFile,
  importFiles,
  exportFiles,
  wipeAllFiles,
  writeEntryFile,
  readEntryFile,
  readAllEntries,
  deleteEntryFile,
  getEntryDir,
  getEntryPath,
  toMarkdown,
  fromMarkdown,
  loadImg,
  saveImg,
  setupDirs,
  mkdir,
}

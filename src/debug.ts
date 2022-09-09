import {FS, joinPath} from "@/backend/files"


async function listAllFiles(dir: string="/", level: number=0) {
  let indent = "  ".repeat(level)
  console.log(`${indent}${dir.split("/").pop()}/`)
  const files = await FS.readdir(dir)
  level += 1
  indent = "  ".repeat(level)
  for (const file of files) {
    const path = joinPath(dir, file)
    const stat = await FS.stat(path)
    if (stat.isDirectory()) {
      await listAllFiles(path, level)
    } else {
      console.log(`${indent}${file}`)
    }
  }
}


export {listAllFiles}

import { strToU8, zipSync } from 'fflate'
import type { Zippable } from 'fflate'
import type { CodeFile } from '../types/file'

// Asks the browser to save `blob` as a file called `fileName`.
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// Text files are stored as text; images are stored as data: URLs and need converting back to bytes.
async function toBytes(file: CodeFile): Promise<Uint8Array> {
  if (file.type !== 'image') return strToU8(file.content)
  const response = await fetch(file.content)
  return new Uint8Array(await response.arrayBuffer())
}

export async function downloadFile(file: CodeFile) {
  const fileName = file.name.slice(file.name.lastIndexOf('/') + 1)
  // Copy into a fresh ArrayBuffer so the Blob constructor accepts it under strict TS types
  const bytes = new Uint8Array(await toBytes(file))
  saveBlob(new Blob([bytes]), fileName)
}

export async function downloadZip(files: CodeFile[], folders: string[]) {
  const entries: Zippable = {}

  // An empty object makes fflate create an (empty) folder entry
  for (const folder of folders) {
    entries[folder] = {}
  }
  for (const file of files) {
    entries[file.name] = await toBytes(file)
  }

  const zip = new Uint8Array(zipSync(entries))
  saveBlob(new Blob([zip], { type: 'application/zip' }), 'project.zip')
}

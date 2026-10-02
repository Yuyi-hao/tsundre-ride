import type { ChallengeAsset, AssetFileType } from '../types/api'
import type { CodeFile } from '../types/file'
import { getFileType } from '../types/file'

const MIME_TYPES: Record<CodeFile['type'], string> = {
  html: 'text/html',
  css: 'text/css',
  javascript: 'text/javascript',
  image: 'application/octet-stream',
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function assetFileTypeFor(path: string): AssetFileType {
  const type = getFileType(path)
  return type && type !== 'image' ? 'code' : 'media'
}

// Workspace file -> Blob for uploading. Images are stored as data: URLs.
export async function codeFileToBlob(file: CodeFile): Promise<Blob> {
  if (file.type === 'image') return (await fetch(file.content)).blob()
  return new Blob([file.content], { type: MIME_TYPES[file.type] })
}

export interface LoadedAssets {
  files: CodeFile[]
  // Paths that couldn't be fetched or aren't html/css/js/image
  skipped: string[]
}

// Downloads challenge assets so they can be opened in the editor/preview.
export async function loadAssetsAsFiles(assets: ChallengeAsset[]): Promise<LoadedAssets> {
  const files: CodeFile[] = []
  const skipped: string[] = []

  await Promise.all(
    assets.map(async (asset) => {
      const path = asset.path || asset.name
      // Unknown extensions are still opened as images when they are media files
      const knownType = getFileType(path)
      if (!knownType && asset.file_type !== 'media') {
        skipped.push(path)
        return
      }
      try {
        if (!asset.download_url) throw new Error('No download URL')
        const response = await fetch(asset.download_url)
        if (!response.ok) throw new Error(String(response.status))
        const isImage = response.headers.get('Content-Type')?.startsWith('image/')
        const type = knownType ?? (isImage ? 'image' : null)
        if (!type) throw new Error('Unsupported file type')
        const content = type === 'image' ? await blobToDataUrl(await response.blob()) : await response.text()
        files.push({ name: path, type, content })
      } catch {
        skipped.push(path)
      }
    }),
  )

  files.sort((a, b) => a.name.localeCompare(b.name))
  return { files, skipped }
}

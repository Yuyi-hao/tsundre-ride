import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { getFileType } from '../types/file'
import type { CodeFile } from '../types/file'

interface FileExplorerProps {
  files: CodeFile[]
  folders: string[]
  activeFileName: string
  onSelectFile: (name: string) => void
  onAddFile: (path: string) => string | null
  onAddFolder: (path: string) => string | null
  onUploadFiles: (uploaded: CodeFile[]) => void
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// "css/base/theme.css" -> "css/base"
function getParent(path: string) {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

// "css/base/theme.css" -> "theme.css"
function getBaseName(path: string) {
  return path.slice(path.lastIndexOf('/') + 1)
}

function FileExplorer({
  files,
  folders,
  activeFileName,
  onSelectFile,
  onAddFile,
  onAddFolder,
  onUploadFiles,
}: FileExplorerProps) {
  const [creating, setCreating] = useState<'file' | 'folder' | null>(null)
  const [newPath, setNewPath] = useState('')
  const [error, setError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  // Every folder: the empty ones plus every parent folder of every file.
  const allFolders = new Set<string>()
  for (const path of [...folders, ...files.map((file) => getParent(file.name))]) {
    let current = path
    while (current) {
      allFolders.add(current)
      current = getParent(current)
    }
  }

  function startCreating(kind: 'file' | 'folder', inFolder = '') {
    setCreating(kind)
    setNewPath(inFolder ? inFolder + '/' : '')
    setError('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = creating === 'file' ? onAddFile(newPath) : onAddFolder(newPath)
    if (result) {
      setError(result)
    } else {
      setCreating(null)
    }
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = '' // lets the same file be uploaded again

    const uploaded: CodeFile[] = []
    let skipped = 0

    for (const file of selected) {
      // Folder uploads keep their structure, e.g. "my-site/css/main.css"
      const path = file.webkitRelativePath || file.name
      const type = getFileType(path)
      if (!type) {
        skipped++
        continue
      }

      const content = type === 'image' ? await readAsDataUrl(file) : await file.text()
      uploaded.push({ name: path, type, content })
    }

    onUploadFiles(uploaded)
    setUploadMessage(skipped > 0 ? `Skipped ${skipped} unsupported file(s)` : '')
  }

  // Renders the folders and files directly inside `parent`, then recurses into each folder.
  function renderTree(parent: string, depth: number) {
    const childFolders = [...allFolders].filter((folder) => getParent(folder) === parent).sort()
    const childFiles = files
      .filter((file) => getParent(file.name) === parent)
      .sort((a, b) => a.name.localeCompare(b.name))
    const indent = { paddingLeft: 16 + depth * 12 }

    return (
      <>
        {childFolders.map((folder) => (
          <li key={folder}>
            <div
              style={indent}
              className="group flex items-center justify-between py-1.5 pr-2 font-mono text-sm text-gray-300"
            >
              <span className="truncate">{getBaseName(folder)}/</span>
              <span className="hidden gap-1 group-hover:flex">
                <button
                  type="button"
                  title="New file in folder"
                  onClick={() => startCreating('file', folder)}
                  className="rounded px-1 text-xs text-gray-500 hover:bg-gray-800 hover:text-white"
                >
                  +file
                </button>
                <button
                  type="button"
                  title="New folder in folder"
                  onClick={() => startCreating('folder', folder)}
                  className="rounded px-1 text-xs text-gray-500 hover:bg-gray-800 hover:text-white"
                >
                  +dir
                </button>
              </span>
            </div>
            <ul>{renderTree(folder, depth + 1)}</ul>
          </li>
        ))}

        {childFiles.map((file) => {
          const isActive = file.name === activeFileName

          return (
            <li key={file.name}>
              <button
                type="button"
                style={indent}
                onClick={() => onSelectFile(file.name)}
                className={`w-full truncate py-1.5 pr-2 text-left font-mono text-sm ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                {getBaseName(file.name)}
              </button>
            </li>
          )
        })}
      </>
    )
  }

  return (
    <nav className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-gray-800 bg-gray-950">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Files
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            title="New file"
            onClick={() => startCreating('file')}
            className="rounded px-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            + File
          </button>
          <button
            type="button"
            title="New folder"
            onClick={() => startCreating('folder')}
            className="rounded px-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            + Folder
          </button>
        </div>
      </div>

      <div className="flex gap-1 px-3 pb-2">
        <label className="cursor-pointer rounded px-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white">
          ⇪ Upload files
          <input type="file" multiple onChange={handleUpload} className="hidden" />
        </label>
        <label className="cursor-pointer rounded px-1.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white">
          ⇪ Upload folder
          <input
            type="file"
            // webkitdirectory isn't in React's types, so it's set directly on the element
            ref={(input) => input?.setAttribute('webkitdirectory', '')}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>
      {uploadMessage && <p className="px-4 pb-2 text-xs text-yellow-500">{uploadMessage}</p>}

      {creating && (
        <form onSubmit={handleSubmit} className="px-3 pb-2">
          <input
            autoFocus
            value={newPath}
            onChange={(event) => {
              setNewPath(event.target.value)
              setError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setCreating(null)
            }}
            onBlur={() => setCreating(null)}
            placeholder={creating === 'file' ? 'path/name.js' : 'folder/name'}
            className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 font-mono text-sm text-white outline-none focus:border-blue-500"
          />
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </form>
      )}

      <ul>{renderTree('', 0)}</ul>
    </nav>
  )
}

export default FileExplorer

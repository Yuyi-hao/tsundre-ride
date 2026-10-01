import { useState } from 'react'
import Header from '../components/Header'
import PreviewPanel from '../components/PreviewPanel'
import EditorPanel from '../components/CodeEditorPanel'
import { getFileType } from '../types/file'
import type { CodeFile } from '../types/file'

const initialFiles: CodeFile[] = [
  {
    name: 'index.html',
    type: 'html',
    content: `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>change, world!</h1>
    <p>Edit the files to get started.</p>
    <button id="btn">Click me</button>

    <script src="script.js"></script>
  </body>
</html>`,
  },
  {
    name: 'style.css',
    type: 'css',
    content: `body {
  font-family: sans-serif;
  padding: 1rem;
}

h1 {
  color: #2563eb;
}`,
  },
  {
    name: 'script.js',
    type: 'javascript',
    content: `document.getElementById('btn').addEventListener('click', () => {
  alert('Button clicked!')
})`,
  },
]

// " /css/theme.css/ " -> "css/theme.css"
function cleanPath(path: string) {
  return path.trim().replace(/^\/+|\/+$/g, '')
}

function CodingWorkspace() {
  const [files, setFiles] = useState<CodeFile[]>(initialFiles)
  // Only needed for empty folders. Folders that contain files come from the file paths.
  const [folders, setFolders] = useState<string[]>([])
  const [activeFileName, setActiveFileName] = useState('index.html')

  function updateFileContent(name: string, content: string) {
    setFiles((prevFiles) =>
      prevFiles.map((file) => (file.name === name ? { ...file, content } : file))
    )
  }

  // Returns an error message, or null on success.
  function addFile(rawPath: string): string | null {
    const path = cleanPath(rawPath)
    if (path.split('/').some((part) => part === '')) return 'Invalid path'

    const type = getFileType(path)
    // Images can only be uploaded, not created empty
    if (!type || type === 'image') return 'File must end in .html, .css or .js'
    if (files.some((file) => file.name === path) || folders.includes(path)) {
      return 'That name already exists'
    }

    setFiles((prevFiles) => [...prevFiles, { name: path, type, content: '' }])
    setActiveFileName(path)
    return null
  }

  function addFolder(rawPath: string): string | null {
    const path = cleanPath(rawPath)
    if (path.split('/').some((part) => part === '')) return 'Invalid path'

    const exists =
      folders.includes(path) ||
      files.some((file) => file.name === path || file.name.startsWith(path + '/'))
    if (exists) return 'That name already exists'

    setFolders((prevFolders) => [...prevFolders, path])
    return null
  }

  // Uploaded files replace existing files with the same path.
  function uploadFiles(uploaded: CodeFile[]) {
    if (uploaded.length === 0) return

    setFiles((prevFiles) => [
      ...prevFiles.filter((file) => !uploaded.some((newFile) => newFile.name === file.name)),
      ...uploaded,
    ])
    setActiveFileName(uploaded[0].name)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950">
      <Header />

      <main className="flex min-h-0 flex-1">
        <EditorPanel
          files={files}
          folders={folders}
          activeFileName={activeFileName}
          onSelectFile={setActiveFileName}
          onChangeFile={updateFileContent}
          onAddFile={addFile}
          onAddFolder={addFolder}
          onUploadFiles={uploadFiles}
        />
        <PreviewPanel files={files} />
      </main>
    </div>
  )
}


export default CodingWorkspace

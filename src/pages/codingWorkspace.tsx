import { useState } from 'react'
import Header from '../components/Header'
import PreviewPanel from '../components/PreviewPanel'
import EditorPanel from '../components/CodeEditorPanel'
import type { CodeFile } from '../types/file'

const initialFiles: CodeFile[] = [
  {
    name: 'index.html',
    type: 'html',
    content: `<h1>change, world!</h1>
<p>Edit the files to get started.</p>
<button id="btn">Click me</button>`,
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

function CodingWorkspace() {
  const [files, setFiles] = useState<CodeFile[]>(initialFiles)
  const [activeFileName, setActiveFileName] = useState('index.html')

  function updateFileContent(name: string, content: string) {
    setFiles((prevFiles) =>
      prevFiles.map((file) => (file.name === name ? { ...file, content } : file))
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-950">
      <Header />

      <main className="flex min-h-0 flex-1">
        <EditorPanel
          files={files}
          activeFileName={activeFileName}
          onSelectFile={setActiveFileName}
          onChangeFile={updateFileContent}
        />
        <PreviewPanel files={files} />
      </main>
    </div>
  )
}


export default CodingWorkspace

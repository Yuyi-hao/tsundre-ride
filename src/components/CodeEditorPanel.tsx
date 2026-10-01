import Editor from '@monaco-editor/react'
import type { CodeFile } from '../types/file'
import FileExplorer from './FileExplorer'

interface CodeEditorPanelProps {
  files: CodeFile[]
  activeFileName: string
  onSelectFile: (name: string) => void
  onChangeFile: (name: string, content: string) => void
}

function CodeEditorPanel({ files, activeFileName, onSelectFile, onChangeFile }: CodeEditorPanelProps) {
  const activeFile = files.find((file) => file.name === activeFileName)

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-gray-950">
      <div className="flex h-10 shrink-0 items-center border-b border-gray-800 px-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Editor
        </h2>
      </div>

      <div className="flex min-h-0 flex-1">
        <FileExplorer
          files={files}
          activeFileName={activeFileName}
          onSelectFile={onSelectFile}
        />

        <div className="min-w-0 flex-1">
          {activeFile && (
            <Editor
              height="100%"
              theme="vs-dark"
              path={activeFile.name}
              language={activeFile.type}
              value={activeFile.content}
              onChange={(value) => onChangeFile(activeFile.name, value ?? '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default CodeEditorPanel

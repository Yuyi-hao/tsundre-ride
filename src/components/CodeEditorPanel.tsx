import Editor from '@monaco-editor/react'
import type { CodeFile } from '../types/file'
import FileExplorer from './FileExplorer'

interface CodeEditorPanelProps {
  files: CodeFile[]
  folders: string[]
  activeFileName: string
  onSelectFile: (name: string) => void
  onChangeFile: (name: string, content: string) => void
  onAddFile: (path: string) => string | null
  onAddFolder: (path: string) => string | null
  onUploadFiles: (uploaded: CodeFile[]) => void
}

function CodeEditorPanel({
  files,
  folders,
  activeFileName,
  onSelectFile,
  onChangeFile,
  onAddFile,
  onAddFolder,
  onUploadFiles,
}: CodeEditorPanelProps) {
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
          folders={folders}
          activeFileName={activeFileName}
          onSelectFile={onSelectFile}
          onAddFile={onAddFile}
          onAddFolder={onAddFolder}
          onUploadFiles={onUploadFiles}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {activeFile && (
            <div
              title={activeFile.name}
              className="flex h-9 shrink-0 items-center border-b border-gray-800 bg-gray-900 px-4 font-mono text-sm"
            >
              {/* "css/theme.css" -> folder part dimmed, file name highlighted */}
              {activeFile.name.includes('/') && (
                <span className="truncate text-gray-500">
                  {activeFile.name.slice(0, activeFile.name.lastIndexOf('/') + 1)}
                </span>
              )}
              <span className="shrink-0 text-gray-100">
                {activeFile.name.slice(activeFile.name.lastIndexOf('/') + 1)}
              </span>
            </div>
          )}

          <div className="min-h-0 flex-1">
            {activeFile?.type === 'image' && (
              <div className="flex h-full items-center justify-center p-4">
                <img
                  src={activeFile.content}
                  alt={activeFile.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            {activeFile && activeFile.type !== 'image' && (
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
      </div>
    </section>
  )
}

export default CodeEditorPanel

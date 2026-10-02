import Editor from '@monaco-editor/react'
import type { CodeFile } from '../types/file'
import { downloadFile, downloadZip } from '../utils/download'
import FileExplorer from './FileExplorer'

interface CodeEditorPanelProps {
  files: CodeFile[]
  folders: string[]
  activeFileName: string
  onSelectFile: (name: string) => void
  // Leave these out (with readOnly) to only view files, e.g. a submission
  onChangeFile?: (name: string, content: string) => void
  onAddFile?: (path: string) => string | null
  onAddFolder?: (path: string) => string | null
  onUploadFiles?: (uploaded: CodeFile[]) => void
  readOnly?: boolean
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
  readOnly = false,
}: CodeEditorPanelProps) {
  const activeFile = files.find((file) => file.name === activeFileName)

  return (
    <section className="flex h-[80vh] min-w-0 flex-col bg-gray-950 md:h-auto md:flex-1">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-800 px-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
          Editor
        </h2>
        <button
          type="button"
          title="Download all files as project.zip"
          onClick={() => downloadZip(files, folders)}
          className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          ⇩ Download all<span className="hidden sm:inline"> (.zip)</span>
        </button>
      </div>

      {/* Small screens: file list above the editor. sm+: file list on the left. */}
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <FileExplorer
          files={files}
          folders={folders}
          activeFileName={activeFileName}
          onSelectFile={onSelectFile}
          onAddFile={onAddFile}
          onAddFolder={onAddFolder}
          onUploadFiles={onUploadFiles}
          readOnly={readOnly}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          {activeFile && (
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-gray-800 bg-gray-900 px-4">
              {/* "css/theme.css" -> folder part dimmed, file name highlighted */}
              <div title={activeFile.name} className="flex min-w-0 flex-1 font-mono text-sm">
                {activeFile.name.includes('/') && (
                  <span className="truncate text-gray-500">
                    {activeFile.name.slice(0, activeFile.name.lastIndexOf('/') + 1)}
                  </span>
                )}
                <span className="shrink-0 text-gray-100">
                  {activeFile.name.slice(activeFile.name.lastIndexOf('/') + 1)}
                </span>
              </div>
              <button
                type="button"
                title="Download this file"
                onClick={() => downloadFile(activeFile)}
                className="shrink-0 rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                ⇩ Download
              </button>
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
                onChange={(value) => onChangeFile?.(activeFile.name, value ?? '')}
                options={{
                  readOnly,
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

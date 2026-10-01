import type { CodeFile } from '../types/file'

interface FileExplorerProps {
  files: CodeFile[]
  activeFileName: string
  onSelectFile: (name: string) => void
}

function FileExplorer({ files, activeFileName, onSelectFile }: FileExplorerProps) {
  return (
    <nav className="flex w-44 shrink-0 flex-col border-r border-gray-800 bg-gray-950">
      <h3 className="px-4 pb-2 pt-3 text-xs font-medium uppercase tracking-wide text-gray-500">
        Files
      </h3>

      <ul>
        {files.map((file) => {
          const isActive = file.name === activeFileName

          return (
            <li key={file.name}>
              <button
                type="button"
                onClick={() => onSelectFile(file.name)}
                className={`w-full px-4 py-1.5 text-left font-mono text-sm ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                {file.name}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default FileExplorer

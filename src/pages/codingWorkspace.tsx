import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { getAnonymousId } from '../api/client'
import ChallengeForm from '../components/ChallengeForm'
import ChallengeTimer from '../components/ChallengeTimer'
import Header from '../components/Header'
import PreviewPanel from '../components/PreviewPanel'
import EditorPanel from '../components/CodeEditorPanel'
import SaveDraftDialog from '../components/SaveDraftDialog'
import { getFileType } from '../types/file'
import type { CodeFile } from '../types/file'
import type { ChallengeDetail, Submission } from '../types/api'

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

interface CodingWorkspaceProps {
  // True on /create: open the "Make challenge" form right away
  startWithChallengeForm?: boolean
  // Set when solving an existing challenge (/challenges/:slug/solve)
  solving?: ChallengeDetail
  // Starter files, e.g. the challenge's uploaded files or a draft's files
  startFiles?: CodeFile[]
  // The draft whose files are open, so saving updates it instead of creating a new one
  editing?: Submission
  // Dismissible message shown under the header
  notice?: string
}

function CodingWorkspace({
  startWithChallengeForm = false,
  solving,
  startFiles,
  editing,
  notice = '',
}: CodingWorkspaceProps) {
  const navigate = useNavigate()
  const [files, setFiles] = useState<CodeFile[]>(() =>
    startFiles?.some((file) => file.type === 'html') ? startFiles : [...initialFiles, ...(startFiles ?? [])]
  )
  // The challenge being solved, or the one published from this workspace
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(solving ?? null)
  const [isChallengeFormOpen, setIsChallengeFormOpen] = useState(startWithChallengeForm)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [visibleNotice, setVisibleNotice] = useState(notice)
  // Only needed for empty folders. Folders that contain files come from the file paths.
  const [folders, setFolders] = useState<string[]>([])
  const [activeFileName, setActiveFileName] = useState(
    () => files.find((file) => file.name === 'index.html')?.name ?? files[0]?.name ?? ''
  )

  const isOwner = challenge?.owner_id === getAnonymousId()

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
    // Mobile: the page scrolls and the panels stack. Desktop (md+): fixed full-screen, side by side.
    <div className="flex min-h-screen flex-col bg-gray-950 md:h-screen md:overflow-hidden">
      <Header>
        {challenge && (
          <span className="hidden min-w-0 items-center gap-2 truncate text-sm text-gray-300 sm:flex">
            <Link to={`/challenges/${challenge.slug}`} className="truncate hover:text-white hover:underline">
              {challenge.name}
            </Link>
            {editing && <span className="shrink-0 text-xs text-gray-500">· editing draft</span>}
            {challenge.status === 'active' && (
              <ChallengeTimer createdAt={challenge.created_at} duration={challenge.duration} className="text-xs" />
            )}
          </span>
        )}
        {!solving && (
          <button
            type="button"
            onClick={() => setIsChallengeFormOpen(true)}
            className={`shrink-0 rounded px-3 py-1.5 text-xs font-medium text-white ${
              challenge ? 'border border-gray-700 hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {challenge ? 'Edit challenge' : 'Make challenge'}
          </button>
        )}
        {challenge && challenge.status === 'active' && (
          <button
            type="button"
            onClick={() => setIsSubmitOpen(true)}
            className="shrink-0 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-500"
          >
            {isOwner ? 'Save reference' : 'Save draft'}
          </button>
        )}
      </Header>

      {isChallengeFormOpen && (
        <ChallengeForm
          initial={challenge}
          projectFiles={files}
          onSaved={setChallenge}
          onClose={() => setIsChallengeFormOpen(false)}
        />
      )}

      {isSubmitOpen && challenge && (
        <SaveDraftDialog
          challengeSlug={challenge.slug}
          challengeName={challenge.name}
          isOwner={isOwner}
          files={files}
          existing={editing}
          onSaved={(submission) => navigate(`/challenges/${challenge.slug}#submission-${submission.slug}`)}
          onClose={() => setIsSubmitOpen(false)}
        />
      )}

      {visibleNotice && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-yellow-900 bg-yellow-950/40 px-4 py-1.5 text-xs text-yellow-300">
          <span className="min-w-0 truncate" title={visibleNotice}>{visibleNotice}</span>
          <button type="button" onClick={() => setVisibleNotice('')} aria-label="Dismiss" className="shrink-0 px-1">
            ✕
          </button>
        </div>
      )}

      <main className="flex flex-col md:min-h-0 md:flex-1 md:flex-row">
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

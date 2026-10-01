import { useEffect, useRef, useState } from 'react'
import type { CodeFile } from '../types/file'
import { buildPreviewDoc, resolvePath } from '../utils/preview'

interface PreviewPanelProps {
    files: CodeFile[]
}

function PreviewPanel({ files }: PreviewPanelProps){
    const [reloadKey, setReloadKey] = useState(0)
    const [pagePath, setPagePath] = useState('index.html')
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const htmlFiles = files.filter((file) => file.type === 'html')
    // Fall back to the first HTML file if the chosen page doesn't exist
    const page = htmlFiles.find((file) => file.name === pagePath) ?? htmlFiles[0]
    const srcDoc = page ? buildPreviewDoc(files, page.name) : ''

    // Links clicked inside the preview arrive here (see NAVIGATION_SCRIPT in utils/preview.ts)
    useEffect(() => {
        function handleMessage(event: MessageEvent) {
            if (event.source !== iframeRef.current?.contentWindow) return
            if (event.data?.type !== 'preview-navigate' || !page) return

            const target = resolvePath(page.name, event.data.href)
            if (target && files.some((file) => file.name === target && file.type === 'html')) {
                setPagePath(target)
            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [files, page])

    return <>
        <section className="flex min-w-0 flex-1 flex-col border-l border-gray-800 bg-gray-900">
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-gray-800 px-4">
                <div className="flex min-w-0 items-center gap-3">
                    <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Preview
                    </h2>
                    {htmlFiles.length > 1 && (
                        <select
                            value={page?.name}
                            onChange={(event) => setPagePath(event.target.value)}
                            className="min-w-0 rounded border border-gray-700 bg-gray-900 px-1 py-0.5 font-mono text-xs text-gray-300"
                        >
                            {htmlFiles.map((file) => (
                                <option key={file.name} value={file.name}>
                                    {file.name}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                    ↻ Reload
                </button>
            </div>
            {page ? (
                <iframe
                    key={reloadKey}
                    ref={iframeRef}
                    title="Preview"
                    srcDoc={srcDoc}
                    sandbox="allow-scripts allow-modals"
                    className="min-h-0 w-full flex-1 bg-white"
                />
            ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                    Add an HTML file to see a preview.
                </div>
            )}
        </section>
    </>;
}

export default PreviewPanel;

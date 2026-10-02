import { useEffect, useRef, useState } from 'react'
import type { CodeFile } from '../types/file'
import { buildPreviewDoc, resolvePath } from '../utils/preview'

interface PreviewPanelProps {
    files: CodeFile[]
}

function PreviewPanel({ files }: PreviewPanelProps){
    const [reloadKey, setReloadKey] = useState(0)
    const [pagePath, setPagePath] = useState('index.html')
    const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
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
        <section className="flex h-[80vh] min-w-0 flex-col border-t border-gray-800 bg-gray-900 md:h-auto md:flex-1 md:border-l md:border-t-0">
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
                <div className="flex shrink-0 items-center gap-2">
                    <div className="flex rounded border border-gray-700 text-xs">
                        {(['desktop', 'mobile'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setViewport(option)}
                                className={`px-2 py-0.5 capitalize ${
                                    viewport === option
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        title="Reload preview"
                        onClick={() => setReloadKey((key) => key + 1)}
                        className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        ↻<span className="hidden sm:inline"> Reload</span>
                    </button>
                </div>
            </div>
            {page ? (
                // Mobile view: a 375px-wide (typical phone) frame centred in the panel
                <div className={`flex min-h-0 flex-1 justify-center ${viewport === 'mobile' ? 'p-4' : ''}`}>
                    <iframe
                        key={reloadKey}
                        ref={iframeRef}
                        title="Preview"
                        srcDoc={srcDoc}
                        sandbox="allow-scripts allow-modals"
                        className={`h-full bg-white ${
                            viewport === 'mobile' ? 'w-[375px] max-w-full rounded border border-gray-700' : 'w-full'
                        }`}
                    />
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                    Add an HTML file to see a preview.
                </div>
            )}
        </section>
    </>;
}

export default PreviewPanel;

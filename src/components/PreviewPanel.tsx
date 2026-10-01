import { useState } from 'react'
import type { CodeFile } from '../types/file'

interface PreviewPanelProps {
    files: CodeFile[]
}

function PreviewPanel({ files }: PreviewPanelProps){
    const [reloadKey, setReloadKey] = useState(0)

    // The page is index.html; every CSS and JS file in the project is included.
    const htmlFile = files.find((file) => file.name === 'index.html') ?? files.find((file) => file.type === 'html')
    const html = htmlFile?.content ?? ''
    const css = files
        .filter((file) => file.type === 'css')
        .map((file) => file.content)
        .join('\n')
    // One <script> per file, so an error in one file doesn't stop the others.
    const scripts = files
        .filter((file) => file.type === 'javascript')
        .map((file) => `<script>${file.content}</script>`)
        .join('\n')

    const srcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
    ${scripts}
  </body>
</html>`

    return <>
        <section className="flex min-w-0 flex-1 flex-col border-l border-gray-800 bg-gray-900">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-gray-800 px-4">
                <h2 className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Preview
                </h2>
                <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                    ↻ Reload
                </button>
            </div>
            <iframe
                key={reloadKey}
                title="Preview"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-modals"
                className="min-h-0 w-full flex-1 bg-white"
            />
        </section>
    </>;
}

export default PreviewPanel;

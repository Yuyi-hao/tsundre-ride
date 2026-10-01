import type { CodeFile } from '../types/file'

// Fake origin, only used so the browser's URL parser can resolve paths like "../css/theme.css".
const BASE_URL = 'https://project.local/'
const BASE_ORIGIN = 'https://project.local'

const MIME_TYPES = {
  html: 'text/html',
  css: 'text/css',
  javascript: 'text/javascript',
}

// Clicking <a href="about.html"> inside the iframe asks the parent to show that page instead.
const NAVIGATION_SCRIPT = `
document.addEventListener('click', function (event) {
  var link = event.target.closest && event.target.closest('a[href]');
  if (!link) return;
  var href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('//') || /^[a-z]+:/i.test(href)) return;
  event.preventDefault();
  parent.postMessage({ type: 'preview-navigate', href: href }, '*');
});
`

// Resolves `ref` as written inside the file `fromPath` to a project path.
// resolvePath('css/main.css', '../img/a.png') -> 'img/a.png'
// Returns null for external URLs (https://..., data:..., #anchor).
export function resolvePath(fromPath: string, ref: string): string | null {
  if (!ref || ref.startsWith('#')) return null
  try {
    const url = new URL(ref, BASE_URL + fromPath)
    if (url.origin !== BASE_ORIGIN) return null
    return decodeURIComponent(url.pathname.slice(1))
  } catch {
    return null
  }
}

// Turns a reference into a data: URL holding the referenced project file, or null if it isn't one.
function urlForRef(fromPath: string, ref: string, files: CodeFile[], depth: number): string | null {
  if (depth > 5) return null // stops circular @imports

  const path = resolvePath(fromPath, ref.trim())
  const file = files.find((f) => f.name === path)
  if (!file) return null
  if (file.type === 'image') return file.content

  const content = file.type === 'css' ? rewriteCss(file.content, file.name, files, depth + 1) : file.content
  return `data:${MIME_TYPES[file.type]};charset=utf-8,${encodeURIComponent(content)}`
}

// Rewrites url(...) and @import "..." inside CSS so they point at project files.
function rewriteCss(css: string, cssPath: string, files: CodeFile[], depth: number): string {
  return css
    .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, _quote, ref: string) => {
      const url = urlForRef(cssPath, ref, files, depth)
      return url ? `url("${url}")` : match
    })
    .replace(/@import\s+(['"])([^'"]+)\1/g, (match, _quote, ref: string) => {
      const url = urlForRef(cssPath, ref, files, depth)
      return url ? `@import url("${url}")` : match
    })
}

// Builds the full HTML document for the iframe from one HTML page and the project files.
export function buildPreviewDoc(files: CodeFile[], pagePath: string): string {
  const page = files.find((file) => file.name === pagePath)
  if (!page) return ''

  const doc = new DOMParser().parseFromString(page.content, 'text/html')

  // <script src>, <img src>, <link href>, <source src>, ...
  doc.querySelectorAll('[src], link[href]').forEach((element) => {
    const attribute = element.hasAttribute('src') ? 'src' : 'href'
    const url = urlForRef(page.name, element.getAttribute(attribute) ?? '', files, 0)
    if (url) element.setAttribute(attribute, url)
  })

  // <style> blocks and style="" attributes can use url(...) too
  doc.querySelectorAll('style').forEach((element) => {
    element.textContent = rewriteCss(element.textContent ?? '', page.name, files, 0)
  })
  doc.querySelectorAll('[style]').forEach((element) => {
    element.setAttribute('style', rewriteCss(element.getAttribute('style') ?? '', page.name, files, 0))
  })

  const navigationScript = doc.createElement('script')
  navigationScript.textContent = NAVIGATION_SCRIPT
  doc.head.prepend(navigationScript)

  return '<!doctype html>\n' + doc.documentElement.outerHTML
}

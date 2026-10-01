export type FileType = 'html' | 'css' | 'javascript' | 'image';

export interface CodeFile{
    // Full path from the project root, e.g. "index.html" or "css/theme.css"
    name: string
    type: FileType
    // Text for html/css/javascript, a data: URL for images
    content: string
};

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico']

export function getFileType(path: string): FileType | null {
    const lower = path.toLowerCase()
    if (lower.endsWith('.html')) return 'html'
    if (lower.endsWith('.css')) return 'css'
    if (lower.endsWith('.js')) return 'javascript'
    if (IMAGE_EXTENSIONS.some((extension) => lower.endsWith(extension))) return 'image'
    return null
}

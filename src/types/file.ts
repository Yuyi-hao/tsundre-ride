export type FileType = 'html' | 'css' | 'javascript';

export interface CodeFile{
    // Full path from the project root, e.g. "index.html" or "css/theme.css"
    name: string
    type: FileType
    content: string
};

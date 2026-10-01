export type FileType = 'html' | 'css' | 'javascript';

export interface CodeFile{
    name: string
    type: FileType
    content: string
};

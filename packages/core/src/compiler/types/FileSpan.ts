export interface FileSpan {
    readonly filePath: string;
    readonly start: number;
    readonly length: number;
    readonly line: number;
    readonly column: number;
}

export interface ASTBaseNode {
    readonly span: FileSpan;
}
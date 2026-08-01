/**
 * Source location span (offset-based representation).
 * 
 * Represents a contiguous range of source code using byte offsets.
 * Line/column information is provided for display purposes but
 * offsets are the canonical representation for compiler operations.
 * 
 * Design rationale:
 * - Lexer/parser naturally produce byte offsets
 * - Incremental compilation requires byte-level granularity
 * - Offset-to-line conversion is O(1) with line map
 * - Range-to-offset conversion requires full file scan
 * 
 * Matches: Rust compiler (BytePos), TypeScript (pos/end), LLVM (byte offsets)
 */
export interface FileSpan {
    /** 
     * Absolute or relative path to source file.
     * Used for diagnostic reporting and artifact caching.
     */
    readonly filePath: string;

    /**
     * Zero-indexed UTF-16 code unit offset of span start.
     * Primary field for span operations (slicing, comparison, invalidation).
     * 
     * Note: JavaScript strings use UTF-16, so emoji and other non-BMP
     * characters count as 2 units. Example: "😀".length === 2
     */
    readonly start: number;

    /**
     * Length in UTF-16 code units.
     * Invariant: start + length must not exceed file size.
     */
    readonly length: number;

    /**
     * One-indexed line number of span start.
     * For diagnostic display only. Not used in span operations.
     */
    readonly line: number;

    /**
     * Zero-indexed column number (UTF-16 code units) of span start.
     * For diagnostic display only. Matches LSP/editor conventions.
     */
    readonly column: number;
}

/**
 * Range-based span representation (for display/diagnostics).
 * Converted from FileSpan when needed for LSP or error reporting.
 */
export interface SourceRange {
    readonly file: string;
    readonly startLine: number;
    readonly startChar: number;
    readonly endLine: number;
    readonly endChar: number;
}

/**
 * Base interface for all AST nodes.
 * Every AST node must have a source location span.
 */
export interface ASTBaseNode {
    readonly span: FileSpan;
}

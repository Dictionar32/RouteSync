/**
 * Source location utilities for FileSpan conversion and mapping.
 * 
 * Provides O(log n) offset-to-line conversion using binary search
 * over a precomputed line start index.
 * 
 * **Important**: JavaScript/TypeScript offsets use UTF-16 code units, not bytes.
 * This means characters outside the Basic Multilingual Plane (e.g., emoji)
 * count as 2 units: "😀".length === 2
 */

import type { FileSpan, SourceRange } from '../types/FileSpan';

/**
 * Line map for O(log n) offset-to-line conversion.
 * Built once per file during lexing using binary search over precomputed line starts.
 * 
 * Usage:
 * ```typescript
 * const lineMap = new LineMap(sourceText);
 * const pos = lineMap.offsetToPosition(100);
 * console.log(`Line ${pos.line}, Column ${pos.column}`);
 * ```
 */
export class LineMap {
    private readonly lineStarts: readonly number[];
    private readonly sourceLength: number;

    constructor(sourceText: string) {
        const starts = [0];

        for (let i = 0; i < sourceText.length; i++) {
            if (sourceText[i] === '\n') {
                starts.push(i + 1);
            }
        }

        this.lineStarts = starts;
        this.sourceLength = sourceText.length;
    }

    /** 
     * Convert source offset to (line, column). 
     * 
     * Note: JavaScript/TypeScript strings use UTF-16 code units, not bytes.
     * For example, "😀".length = 2 (UTF-16 code units), not 4 (UTF-8 bytes).
     * 
     * Time complexity: O(log n) binary search where n = number of lines.
     * 
     * @param offset - Zero-indexed UTF-16 code unit offset in source file
     * @returns Line (1-indexed) and column (0-indexed) position
     * @throws Error if offset is out of range
     */
    offsetToPosition(offset: number): { line: number; column: number } {
        if (offset < 0 || offset > this.sourceLength) {
            throw new Error(
                `Offset ${offset} out of range [0, ${this.sourceLength}]`
            );
        }

        const lineIndex = this.binarySearch(offset);
        return {
            line: lineIndex + 1,  // 1-indexed
            column: offset - this.lineStarts[lineIndex]  // 0-indexed
        };
    }

    /**
     * Convert (line, column) to UTF-16 source offset.
     * 
     * @param line - 1-indexed line number
     * @param column - 0-indexed column number (UTF-16 code units)
     * @returns Zero-indexed UTF-16 code unit offset
     * @throws Error if line or column is out of bounds
     */
    positionToOffset(line: number, column: number): number {
        const lineIndex = line - 1;
        if (lineIndex < 0 || lineIndex >= this.lineStarts.length) {
            throw new Error(`Line ${line} out of bounds (1-${this.lineStarts.length})`);
        }
        if (column < 0) {
            throw new Error(`Column cannot be negative: ${column}`);
        }
        return this.lineStarts[lineIndex] + column;
    }

    /**
     * Get line count in source file.
     */
    get lineCount(): number {
        return this.lineStarts.length;
    }

    /**
     * Binary search to find line index containing offset.
     * Returns the largest line index where lineStarts[i] <= offset.
     */
    private binarySearch(offset: number): number {
        let low = 0, high = this.lineStarts.length - 1;
        while (low < high) {
            const mid = Math.floor((low + high + 1) / 2);
            if (this.lineStarts[mid] <= offset) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }
        return low;
    }
}

/**
 * Convert FileSpan to SourceRange for LSP/diagnostic display.
 * 
 * This is primarily used for:
 * - Error message formatting
 * - LSP hover tooltips
 * - IDE navigation
 * 
 * @param span - Offset-based file span
 * @param lineMap - Precomputed line map for the source file
 * @returns Range-based location for display
 */
export function spanToRange(span: FileSpan, lineMap: LineMap): SourceRange {
    const endOffset = span.start + span.length;
    const endPos = lineMap.offsetToPosition(endOffset);

    return {
        file: span.filePath,
        startLine: span.line,
        startChar: span.column,
        endLine: endPos.line,
        endChar: endPos.column
    };
}

/**
 * Create FileSpan from range (requires reverse lookup - expensive).
 * 
 * ⚠️ Warning: This operation requires offset calculation and should only
 * be used during parsing/initial construction, not in hot paths.
 * 
 * @param filePath - Path to source file
 * @param range - Range-based location
 * @param lineMap - Precomputed line map
 * @returns Offset-based file span
 */
export function rangeToSpan(
    filePath: string,
    range: SourceRange,
    lineMap: LineMap
): FileSpan {
    const start = lineMap.positionToOffset(range.startLine, range.startChar);
    const end = lineMap.positionToOffset(range.endLine, range.endChar);

    return {
        filePath,
        start,
        length: end - start,
        line: range.startLine,
        column: range.startChar
    };
}

/**
 * Create FileSpan from offset and length.
 * 
 * This is the recommended way to create FileSpan during lexing/parsing.
 * Automatically computes line/column from the offset.
 * 
 * @param filePath - Path to source file
 * @param start - Zero-indexed UTF-16 offset
 * @param length - Length in UTF-16 code units
 * @param lineMap - Precomputed line map
 * @returns Complete FileSpan with line/column information
 */
export function createFileSpan(
    filePath: string,
    start: number,
    length: number,
    lineMap: LineMap
): FileSpan {
    const pos = lineMap.offsetToPosition(start);

    return {
        filePath,
        start,
        length,
        line: pos.line,
        column: pos.column
    };
}

/**
 * Compute end position (line, column) from FileSpan.
 * 
 * This is a convenience helper for span operations that need
 * to know where a span ends in line/column terms.
 * 
 * @param span - File span with offset information
 * @param lineMap - Precomputed line map
 * @returns End position (line 1-indexed, column 0-indexed)
 */
export function spanEnd(span: FileSpan, lineMap: LineMap): { line: number; column: number } {
    return lineMap.offsetToPosition(span.start + span.length);
}

/**
 * Check if a UTF-16 source offset is within a FileSpan.
 * 
 * @param span - File span to check
 * @param offset - UTF-16 code unit offset to test
 * @returns true if offset is within [span.start, span.start + span.length)
 */
export function spanContains(span: FileSpan, offset: number): boolean {
    return offset >= span.start && offset < span.start + span.length;
}

/**
 * Compare two FileSpans for ordering.
 * 
 * Spans are ordered by:
 * 1. File path (lexicographic)
 * 2. Start offset (ascending)
 * 3. Length (ascending)
 * 
 * @returns Negative if a < b, zero if equal, positive if a > b
 */
export function compareSpans(a: FileSpan, b: FileSpan): number {
    if (a.filePath !== b.filePath) {
        return a.filePath.localeCompare(b.filePath);
    }
    if (a.start !== b.start) {
        return a.start - b.start;
    }
    return a.length - b.length;
}

/**
 * Merge two adjacent or overlapping FileSpans.
 * 
 * @param a - First span
 * @param b - Second span
 * @returns Merged span covering both inputs
 * @throws Error if spans are from different files
 */
export function mergeSpans(a: FileSpan, b: FileSpan): FileSpan {
    if (a.filePath !== b.filePath) {
        throw new Error(`Cannot merge spans from different files: ${a.filePath} and ${b.filePath}`);
    }

    const start = Math.min(a.start, b.start);
    const end = Math.max(a.start + a.length, b.start + b.length);

    return {
        filePath: a.filePath,
        start,
        length: end - start,
        line: start === a.start ? a.line : b.line,
        column: start === a.start ? a.column : b.column
    };
}

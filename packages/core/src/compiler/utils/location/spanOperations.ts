/**
 * FileSpan and SourceRange conversion and manipulation operations.
 *
 * @module compiler/utils/location
 */

import type { FileSpan, SourceRange } from '../../types/FileSpan';
import type { LineMap } from './lineMap';

/**
 * Convert FileSpan to SourceRange for LSP/diagnostic display.
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
 * Automatically computes line/column from the offset.
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
 */
export function spanEnd(span: FileSpan, lineMap: LineMap): { line: number; column: number } {
    return lineMap.offsetToPosition(span.start + span.length);
}

/**
 * Check if a UTF-16 source offset is within a FileSpan.
 */
export function spanContains(span: FileSpan, offset: number): boolean {
    return offset >= span.start && offset < span.start + span.length;
}

/**
 * Compare two FileSpans for ordering.
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

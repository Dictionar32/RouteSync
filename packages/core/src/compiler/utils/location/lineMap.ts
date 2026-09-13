/**
 * LineMap: O(log n) offset-to-line conversion.
 * Built once per file during lexing using binary search over precomputed line starts.
 *
 * @module compiler/utils/location
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

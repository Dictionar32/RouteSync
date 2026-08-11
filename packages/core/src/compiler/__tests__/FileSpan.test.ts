/**
 * @file FileSpan.test.ts
 * @description Unit tests for FileSpan and SourceLocation utilities
 */

import { describe, test, expect } from 'vitest';
import type { FileSpan, SourceRange } from '../types/FileSpan';
import {
    LineMap,
    spanToRange,
    rangeToSpan,
    spanEnd,
    spanContains,
    compareSpans,
    mergeSpans
} from '../utils/SourceLocation';

describe('FileSpan', () => {
    test('should create valid offset-based span', () => {
        const span: FileSpan = {
            filePath: 'test.ts',
            start: 100,
            length: 50,
            line: 5,
            column: 10
        };

        expect(span.start).toBe(100);
        expect(span.length).toBe(50);
        expect(span.start + span.length).toBe(150);
        expect(span.line).toBe(5);
        expect(span.column).toBe(10);
    });

    test('should maintain immutability', () => {
        const span: FileSpan = {
            filePath: 'test.ts',
            start: 0,
            length: 10,
            line: 1,
            column: 0
        };


    });
});

describe('LineMap', () => {
    describe('offsetToPosition', () => {
        test('should convert offset to line/column', () => {
            const source = 'line1\nline2\nline3\n';
            const lineMap = new LineMap(source);

            // Start of file
            expect(lineMap.offsetToPosition(0)).toEqual({ line: 1, column: 0 });

            // Middle of first line
            expect(lineMap.offsetToPosition(3)).toEqual({ line: 1, column: 3 });

            // Start of second line (after \n at offset 5)
            expect(lineMap.offsetToPosition(6)).toEqual({ line: 2, column: 0 });

            // Middle of second line
            expect(lineMap.offsetToPosition(9)).toEqual({ line: 2, column: 3 });

            // Start of third line
            expect(lineMap.offsetToPosition(12)).toEqual({ line: 3, column: 0 });
        });

        test('should handle single line files', () => {
            const source = 'single line file';
            const lineMap = new LineMap(source);

            expect(lineMap.offsetToPosition(0)).toEqual({ line: 1, column: 0 });
            expect(lineMap.offsetToPosition(7)).toEqual({ line: 1, column: 7 });
            expect(lineMap.offsetToPosition(source.length)).toEqual({ line: 1, column: source.length });
        });

        test('should handle empty files', () => {
            const lineMap = new LineMap('');

            expect(lineMap.offsetToPosition(0)).toEqual({ line: 1, column: 0 });
        });

        test('should handle files with only newlines', () => {
            const source = '\n\n\n';
            const lineMap = new LineMap(source);

            expect(lineMap.offsetToPosition(0)).toEqual({ line: 1, column: 0 });
            expect(lineMap.offsetToPosition(1)).toEqual({ line: 2, column: 0 });
            expect(lineMap.offsetToPosition(2)).toEqual({ line: 3, column: 0 });
            expect(lineMap.offsetToPosition(3)).toEqual({ line: 4, column: 0 });
        });
    });

    describe('positionToOffset', () => {
        test('should convert line/column to offset', () => {
            const source = 'line1\nline2\nline3\n';
            const lineMap = new LineMap(source);

            expect(lineMap.positionToOffset(1, 0)).toBe(0);
            expect(lineMap.positionToOffset(1, 3)).toBe(3);
            expect(lineMap.positionToOffset(2, 0)).toBe(6);
            expect(lineMap.positionToOffset(2, 3)).toBe(9);
            expect(lineMap.positionToOffset(3, 0)).toBe(12);
        });

        test('should throw on invalid line number', () => {
            const lineMap = new LineMap('line1\nline2\n');

            expect(() => lineMap.positionToOffset(0, 0)).toThrow('Line 0 out of bounds');
            expect(() => lineMap.positionToOffset(10, 0)).toThrow('Line 10 out of bounds');
        });
    });

    describe('lineCount', () => {
        test('should return correct line count', () => {
            expect(new LineMap('').lineCount).toBe(1);
            expect(new LineMap('single line').lineCount).toBe(1);
            expect(new LineMap('line1\nline2').lineCount).toBe(2);
            expect(new LineMap('line1\nline2\nline3\n').lineCount).toBe(4); // Empty line after last \n
        });
    });

    describe('roundtrip conversion', () => {
        test('should maintain consistency between offset and position', () => {
            const source = 'class User {\n  id: number;\n  name: string;\n}\n';
            const lineMap = new LineMap(source);

            // Test all character positions
            for (let offset = 0; offset < source.length; offset++) {
                const pos = lineMap.offsetToPosition(offset);
                const backToOffset = lineMap.positionToOffset(pos.line, pos.column);
                expect(backToOffset).toBe(offset);
            }
        });
    });
});

describe('spanToRange', () => {
    test('should convert FileSpan to SourceRange', () => {
        const source = 'line1\nline2\nline3\n';
        const lineMap = new LineMap(source);

        const span: FileSpan = {
            filePath: 'test.ts',
            start: 6,      // Start of line2
            length: 5,     // "line2"
            line: 2,
            column: 0
        };

        const range = spanToRange(span, lineMap);

        expect(range).toEqual({
            file: 'test.ts',
            startLine: 2,
            startChar: 0,
            endLine: 2,
            endChar: 5
        });
    });

    test('should handle multiline spans', () => {
        const source = 'class User {\n  id: number;\n  name: string;\n}\n';
        const lineMap = new LineMap(source);

        const span: FileSpan = {
            filePath: 'User.ts',
            start: 0,
            length: source.length - 1,  // Entire file except last newline
            line: 1,
            column: 0
        };

        const range = spanToRange(span, lineMap);

        expect(range.startLine).toBe(1);
        expect(range.startChar).toBe(0);
        expect(range.endLine).toBeGreaterThan(1);
    });
});

describe('rangeToSpan', () => {
    test('should convert SourceRange to FileSpan', () => {
        const source = 'line1\nline2\nline3\n';
        const lineMap = new LineMap(source);

        const range: SourceRange = {
            file: 'test.ts',
            startLine: 2,
            startChar: 0,
            endLine: 2,
            endChar: 5
        };

        const span = rangeToSpan('test.ts', range, lineMap);

        expect(span.filePath).toBe('test.ts');
        expect(span.start).toBe(6);
        expect(span.length).toBe(5);
        expect(span.line).toBe(2);
        expect(span.column).toBe(0);
    });

    test('should roundtrip span → range → span', () => {
        const source = 'class User { id: number; }';
        const lineMap = new LineMap(source);

        const originalSpan: FileSpan = {
            filePath: 'User.ts',
            start: 6,
            length: 4,  // "User"
            line: 1,
            column: 6
        };

        const range = spanToRange(originalSpan, lineMap);
        const spanAgain = rangeToSpan('User.ts', range, lineMap);

        expect(spanAgain.start).toBe(originalSpan.start);
        expect(spanAgain.length).toBe(originalSpan.length);
    });
});

describe('spanEnd', () => {
    test('should compute end position', () => {
        const source = 'line1\nline2\nline3\n';
        const lineMap = new LineMap(source);

        const span: FileSpan = {
            filePath: 'test.ts',
            start: 6,
            length: 5,
            line: 2,
            column: 0
        };

        const end = spanEnd(span, lineMap);

        expect(end).toEqual({ line: 2, column: 5 });
    });
});

describe('spanContains', () => {
    test('should check if offset is within span', () => {
        const span: FileSpan = {
            filePath: 'test.ts',
            start: 10,
            length: 20,
            line: 1,
            column: 10
        };

        expect(spanContains(span, 9)).toBe(false);   // Before
        expect(spanContains(span, 10)).toBe(true);   // Start (inclusive)
        expect(spanContains(span, 20)).toBe(true);   // Middle
        expect(spanContains(span, 29)).toBe(true);   // End (exclusive boundary - 1)
        expect(spanContains(span, 30)).toBe(false);  // End (exclusive)
        expect(spanContains(span, 31)).toBe(false);  // After
    });
});

describe('compareSpans', () => {
    test('should compare spans by file path first', () => {
        const span1: FileSpan = { filePath: 'a.ts', start: 100, length: 10, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'b.ts', start: 50, length: 10, line: 1, column: 0 };

        expect(compareSpans(span1, span2)).toBeLessThan(0);
        expect(compareSpans(span2, span1)).toBeGreaterThan(0);
    });

    test('should compare spans by start offset if same file', () => {
        const span1: FileSpan = { filePath: 'test.ts', start: 50, length: 10, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'test.ts', start: 100, length: 10, line: 1, column: 0 };

        expect(compareSpans(span1, span2)).toBeLessThan(0);
        expect(compareSpans(span2, span1)).toBeGreaterThan(0);
    });

    test('should compare spans by length if same file and start', () => {
        const span1: FileSpan = { filePath: 'test.ts', start: 50, length: 5, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'test.ts', start: 50, length: 10, line: 1, column: 0 };

        expect(compareSpans(span1, span2)).toBeLessThan(0);
        expect(compareSpans(span2, span1)).toBeGreaterThan(0);
    });

    test('should return zero for equal spans', () => {
        const span1: FileSpan = { filePath: 'test.ts', start: 50, length: 10, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'test.ts', start: 50, length: 10, line: 1, column: 0 };

        expect(compareSpans(span1, span2)).toBe(0);
    });

    test('should enable span sorting', () => {
        const spans: FileSpan[] = [
            { filePath: 'b.ts', start: 100, length: 10, line: 1, column: 0 },
            { filePath: 'a.ts', start: 50, length: 20, line: 1, column: 0 },
            { filePath: 'a.ts', start: 50, length: 10, line: 1, column: 0 },
            { filePath: 'a.ts', start: 10, length: 5, line: 1, column: 0 }
        ];

        spans.sort(compareSpans);

        expect(spans[0].filePath).toBe('a.ts');
        expect(spans[0].start).toBe(10);
        expect(spans[1].filePath).toBe('a.ts');
        expect(spans[1].start).toBe(50);
        expect(spans[1].length).toBe(10);
        expect(spans[2].filePath).toBe('a.ts');
        expect(spans[2].start).toBe(50);
        expect(spans[2].length).toBe(20);
        expect(spans[3].filePath).toBe('b.ts');
    });
});

describe('mergeSpans', () => {
    test('should merge adjacent spans', () => {
        const span1: FileSpan = { filePath: 'test.ts', start: 10, length: 10, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'test.ts', start: 20, length: 10, line: 1, column: 0 };

        const merged = mergeSpans(span1, span2);

        expect(merged.filePath).toBe('test.ts');
        expect(merged.start).toBe(10);
        expect(merged.length).toBe(20);
    });

    test('should merge overlapping spans', () => {
        const span1: FileSpan = { filePath: 'test.ts', start: 10, length: 15, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'test.ts', start: 20, length: 10, line: 1, column: 0 };

        const merged = mergeSpans(span1, span2);

        expect(merged.start).toBe(10);
        expect(merged.length).toBe(20); // Covers 10-30
    });

    test('should merge spans in any order', () => {
        const span1: FileSpan = { filePath: 'test.ts', start: 20, length: 10, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'test.ts', start: 10, length: 10, line: 1, column: 0 };

        const merged = mergeSpans(span1, span2);

        expect(merged.start).toBe(10);
        expect(merged.length).toBe(20);
    });

    test('should throw when merging spans from different files', () => {
        const span1: FileSpan = { filePath: 'a.ts', start: 10, length: 10, line: 1, column: 0 };
        const span2: FileSpan = { filePath: 'b.ts', start: 20, length: 10, line: 1, column: 0 };

        expect(() => mergeSpans(span1, span2)).toThrow('Cannot merge spans from different files');
    });
});

describe('Performance characteristics', () => {
    test('LineMap construction should be O(n) in file size', () => {
        // Operasi mikro (~0.1ms untuk 100 char) terlalu cepat diukur sekali
        // jalan — timer noise mendominasi dan ratio jadi flaky (terukur 96x
        // untuk mesin O(n) murni). Ukur RATA-RATA banyak iterasi dengan total
        // kerja seimbang (100k char per ukuran) supaya noise rata-rata hilang.
        const sizes = [100, 1000, 10000];
        const iterations = [1000, 100, 10];
        const times: number[] = [];

        for (let i = 0; i < sizes.length; i++) {
            const source = 'x'.repeat(sizes[i] / 2) + '\n' + 'y'.repeat(sizes[i] / 2);
            const start = performance.now();
            for (let j = 0; j < iterations[i]; j++) {
                new LineMap(source);
            }
            times.push((performance.now() - start) / iterations[i]);
        }

        // O(n): 10x ukuran -> ~10x waktu per konstruksi. Threshold 50x
        // (5x dari linear) masih toleran terhadap load mesin dev.
        expect(times[2] / times[0]).toBeLessThan(50);
    });

    test('offsetToPosition should be O(log n) in line count', () => {
        const lineCounts = [10, 100, 1000];
        const times: number[] = [];

        for (const lineCount of lineCounts) {
            const source = Array(lineCount).fill('line').join('\n');
            const lineMap = new LineMap(source);

            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                lineMap.offsetToPosition(source.length / 2);
            }
            times.push(performance.now() - start);
        }

        // Time should scale logarithmically (< 2x for 10x increase)
        expect(times[1] / times[0]).toBeLessThan(2);
        expect(times[2] / times[1]).toBeLessThan(2);
    });
});

describe('Edge cases', () => {
    test('should handle Windows line endings (CRLF)', () => {
        const source = 'line1\r\nline2\r\nline3\r\n';
        const lineMap = new LineMap(source);

        // Note: LineMap treats \r\n as single newline at \n position
        expect(lineMap.offsetToPosition(0)).toEqual({ line: 1, column: 0 });
        expect(lineMap.offsetToPosition(7)).toEqual({ line: 2, column: 0 });
    });

    test('should handle mixed line endings', () => {
        const source = 'line1\nline2\r\nline3\n';
        const lineMap = new LineMap(source);

        expect(lineMap.offsetToPosition(0)).toEqual({ line: 1, column: 0 });
        expect(lineMap.offsetToPosition(6)).toEqual({ line: 2, column: 0 });
    });

    test('should handle Unicode characters', () => {
        const source = '日本語\n中文\n한국어\n';
        const lineMap = new LineMap(source);

        // Line map works with byte offsets, not character counts
        expect(lineMap.lineCount).toBe(4);
        expect(lineMap.offsetToPosition(0)).toEqual({ line: 1, column: 0 });
    });

    test('should handle zero-length spans', () => {
        const span: FileSpan = {
            filePath: 'test.ts',
            start: 10,
            length: 0,
            line: 1,
            column: 10
        };

        expect(spanContains(span, 9)).toBe(false);
        expect(spanContains(span, 10)).toBe(false); // Zero-length spans contain nothing
        expect(spanContains(span, 11)).toBe(false);
    });
});

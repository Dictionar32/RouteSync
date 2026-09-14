/**
 * CodeSink.ts
 *
 * Bufferless and In-Memory Dual-Mode Stream Writer for Generated Code.
 * Decouples Code Emission from Domain Models and formatting passes.
 *
 * @module compiler/sink
 */

export interface CodeSink {
    writeLine(line: string): void;
    writeBlankLine(): void;
    writeBlock(block: string): void;
    indent(): void;
    dedent(): void;
}

export interface SinkMetadata {
    linesOfCode: number;
    typeCount: number;
    warnings: readonly string[];
}

/**
 * In-Memory CodeSink for programmatic compilation, test harnesses, and metadata tracking.
 */
export class MemoryCodeSink implements CodeSink {
    private readonly lines: string[] = [];
    private indentLevel = 0;
    private indentString = '  ';
    private _typeCount = 0;
    private readonly _warnings: string[] = [];
    private readonly _customMetadata: Record<string, unknown> = {};

    constructor(metadata?: Record<string, unknown>) {
        if (metadata) {
            Object.assign(this._customMetadata, metadata);
        }
    }

    public writeLine(line: string): void {
        if (line.length === 0) {
            this.lines.push('');
            return;
        }
        const prefix = this.indentString.repeat(this.indentLevel);
        this.lines.push(`${prefix}${line}`);
    }

    public writeBlankLine(): void {
        this.lines.push('');
    }

    public writeBlock(block: string): void {
        const blockLines = block.split('\n');
        for (const line of blockLines) {
            this.writeLine(line);
        }
    }

    public indent(): void {
        this.indentLevel++;
    }

    public dedent(): void {
        if (this.indentLevel > 0) {
            this.indentLevel--;
        }
    }

    public incrementTypeCount(amount = 1): void {
        this._typeCount += amount;
    }

    public addWarning(warning: string): void {
        this._warnings.push(warning);
    }

    public getCode(): string {
        return this.lines.join('\n');
    }

    public toString(): string {
        return this.getCode();
    }

    public getLineCount(): number {
        return this.lines.length;
    }

    public getMetadata(): SinkMetadata & Record<string, unknown> {
        return Object.freeze({
            linesOfCode: this.lines.length,
            typeCount: this._typeCount,
            warnings: Object.freeze([...this._warnings]),
            ...this._customMetadata
        });
    }
}

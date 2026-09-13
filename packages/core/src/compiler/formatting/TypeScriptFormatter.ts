/**
 * TypeScriptFormatter.ts
 *
 * Active Consumer Orchestrator for TypeScript code formatting.
 * Pure flow declaration: coordinates import sorting, indentation, and syntax normalization.
 *
 * @module compiler/formatting
 */

import type { Formatter, FormatOptions } from './Formatter';
import {
    normalizeLineEndings,
    sortImports,
    applyIndentation,
    handleSemicolons,
    normalizeQuotes,
    addTrailingCommas,
    applyLineLength,
    cleanupWhitespace
} from './steps';

/**
 * TypeScript code formatter.
 * Active Consumer executing the sequential code formatting pipeline.
 */
export class TypeScriptFormatter implements Formatter {
    /**
     * Format TypeScript code using pure sequential flow.
     */
    public format(code: string, options: FormatOptions): string {
        let formatted = normalizeLineEndings(code, options);

        if (options.sortImports) {
            formatted = sortImports(formatted);
        }

        formatted = applyIndentation(formatted, options);
        formatted = handleSemicolons(formatted, options);
        formatted = normalizeQuotes(formatted, options);

        if (options.addTrailingComma) {
            formatted = addTrailingCommas(formatted);
        }

        formatted = applyLineLength(formatted, options);
        formatted = cleanupWhitespace(formatted);

        return formatted;
    }

    /**
     * Format multiple files
     */
    public formatMany(files: string[], options: FormatOptions): string[] {
        return files.map(file => this.format(file, options));
    }
}

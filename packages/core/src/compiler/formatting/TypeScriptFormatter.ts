import type { Formatter, FormatOptions } from './Formatter';

/**
 * TypeScript code formatter
 * 
 * Applies consistent formatting to generated TypeScript code:
 * - Proper indentation
 * - Line breaks
 * - Import sorting
 * - Trailing commas
 * - Semicolons
 */
export class TypeScriptFormatter implements Formatter {
    /**
     * Format TypeScript code
     */
    public format(code: string, options: FormatOptions): string {
        let formatted = code;

        // 1. Normalize line endings
        formatted = this.normalizeLineEndings(formatted, options);

        // 2. Sort imports
        if (options.sortImports) {
            formatted = this.sortImports(formatted);
        }

        // 3. Apply indentation
        formatted = this.applyIndentation(formatted, options);

        // 4. Add/remove semicolons
        formatted = this.handleSemicolons(formatted, options);

        // 5. Normalize quotes
        formatted = this.normalizeQuotes(formatted, options);

        // 6. Add trailing commas
        if (options.addTrailingComma) {
            formatted = this.addTrailingCommas(formatted);
        }

        // 7. Apply line length limits
        formatted = this.applyLineLength(formatted, options);

        // 8. Clean up extra whitespace
        formatted = this.cleanupWhitespace(formatted);

        return formatted;
    }

    /**
     * Format multiple files
     */
    public formatMany(files: string[], options: FormatOptions): string[] {
        return files.map(file => this.format(file, options));
    }

    /**
     * Normalize line endings
     */
    private normalizeLineEndings(code: string, options: FormatOptions): string {
        const lineEnding = options.lineEnding === 'crlf' ? '\r\n' : '\n';
        return code.replace(/\r\n|\n/g, lineEnding);
    }

    /**
     * Sort import statements alphabetically
     */
    private sortImports(code: string): string {
        const lines = code.split('\n');
        const imports: string[] = [];
        const rest: string[] = [];
        let inImportBlock = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed.startsWith('import ')) {
                imports.push(line);
                inImportBlock = true;
            } else if (inImportBlock && trimmed === '') {
                // Empty line after imports - keep it
                rest.push(line);
                inImportBlock = false;
            } else {
                rest.push(line);
            }
        }

        // Sort imports
        imports.sort((a, b) => {
            // Type imports first
            const aIsType = a.includes('import type');
            const bIsType = b.includes('import type');
            if (aIsType && !bIsType) return -1;
            if (!aIsType && bIsType) return 1;

            // Then alphabetically
            return a.localeCompare(b);
        });

        // Reconstruct with sorted imports
        if (imports.length > 0) {
            return [...imports, '', ...rest].join('\n');
        }

        return rest.join('\n');
    }

    /**
     * Apply proper indentation
     */
    private applyIndentation(code: string, options: FormatOptions): string {
        const indent = options.indentStyle === 'tab'
            ? '\t'
            : ' '.repeat(options.indentSize);

        const lines = code.split('\n');
        let level = 0;
        const formatted: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip empty lines
            if (line === '') {
                formatted.push('');
                continue;
            }

            // Decrease indent for closing braces
            if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
                level = Math.max(0, level - 1);
            }

            // Apply indentation
            formatted.push(indent.repeat(level) + line);

            // Increase indent for opening braces
            if (line.endsWith('{') || line.endsWith('[') || line.endsWith('(')) {
                level++;
            }
        }

        return formatted.join('\n');
    }

    /**
     * Add or remove semicolons
     */
    private handleSemicolons(code: string, options: FormatOptions): string {
        if (!options.addSemicolons) {
            return code;
        }

        const lines = code.split('\n');
        const formatted: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines, comments, and lines that already have semicolons
            if (
                trimmed === '' ||
                trimmed.startsWith('//') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*') ||
                trimmed.endsWith(';') ||
                trimmed.endsWith('{') ||
                trimmed.endsWith('}') ||
                trimmed.endsWith(',')
            ) {
                formatted.push(line);
                continue;
            }

            // Check if line needs semicolon
            const needsSemicolon = (
                trimmed.startsWith('import ') ||
                trimmed.startsWith('export ') ||
                trimmed.match(/^(const|let|var|type|interface|return)/)
            );

            if (needsSemicolon && !trimmed.endsWith(';')) {
                formatted.push(line + ';');
            } else {
                formatted.push(line);
            }
        }

        return formatted.join('\n');
    }

    /**
     * Normalize quote style
     */
    private normalizeQuotes(code: string, options: FormatOptions): string {
        const target = options.quoteStyle === 'single' ? "'" : '"';
        const source = options.quoteStyle === 'single' ? '"' : "'";

        // Simple replacement (not handling escaped quotes or template literals)
        return code.replace(new RegExp(source, 'g'), target);
    }

    /**
     * Add trailing commas
     */
    private addTrailingCommas(code: string): string {
        const lines = code.split('\n');
        const formatted: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

            // Check if this line should have a trailing comma
            const shouldAddComma = (
                !trimmed.endsWith(',') &&
                !trimmed.endsWith('{') &&
                !trimmed.endsWith('[') &&
                trimmed !== '' &&
                (nextLine.startsWith('}') || nextLine.startsWith(']') || nextLine.startsWith(')'))
            );

            if (shouldAddComma) {
                formatted.push(line + ',');
            } else {
                formatted.push(line);
            }
        }

        return formatted.join('\n');
    }

    /**
     * Apply line length limits
     */
    private applyLineLength(code: string, options: FormatOptions): string {
        // TODO: Implement line wrapping for long lines
        // This is complex and depends on context (imports, parameters, etc.)
        return code;
    }

    /**
     * Clean up extra whitespace
     */
    private cleanupWhitespace(code: string): string {
        // Remove trailing whitespace from each line
        const lines = code.split('\n').map(line => line.trimEnd());

        // Remove multiple consecutive empty lines
        const formatted: string[] = [];
        let emptyLineCount = 0;

        for (const line of lines) {
            if (line.trim() === '') {
                emptyLineCount++;
                if (emptyLineCount <= 1) {
                    formatted.push(line);
                }
            } else {
                emptyLineCount = 0;
                formatted.push(line);
            }
        }

        // Ensure file ends with single newline
        let result = formatted.join('\n');
        result = result.trimEnd() + '\n';

        return result;
    }
}

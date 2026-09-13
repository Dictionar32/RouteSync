/**
 * syntaxNormalizer.ts
 *
 * Normalization helpers for line endings, quotes, semicolons, trailing commas, and whitespace.
 *
 * @module compiler/formatting/steps
 */

import type { FormatOptions } from '../Formatter';

export function normalizeLineEndings(code: string, options: FormatOptions): string {
    const lineEnding = options.lineEnding === 'crlf' ? '\r\n' : '\n';
    return code.replace(/\r\n|\n/g, lineEnding);
}

export function normalizeQuotes(code: string, options: FormatOptions): string {
    const target = options.quoteStyle === 'single' ? "'" : '"';
    const source = options.quoteStyle === 'single' ? '"' : "'";
    return code.replace(new RegExp(source, 'g'), target);
}

export function handleSemicolons(code: string, options: FormatOptions): string {
    if (!options.addSemicolons) {
        return code;
    }

    const lines = code.split('\n');
    const formatted: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();

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

export function addTrailingCommas(code: string): string {
    const lines = code.split('\n');
    const formatted: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

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

export function applyLineLength(code: string, _options: FormatOptions): string {
    return code;
}

export function cleanupWhitespace(code: string): string {
    const lines = code.split('\n').map(line => line.trimEnd());
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

    let result = formatted.join('\n');
    result = result.trimEnd() + '\n';
    return result;
}

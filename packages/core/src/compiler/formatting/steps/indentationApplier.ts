/**
 * indentationApplier.ts
 *
 * Applies block indentation based on braces and brackets.
 *
 * @module compiler/formatting/steps
 */

import type { FormatOptions } from '../Formatter';

export function applyIndentation(code: string, options: FormatOptions): string {
    const indent = options.indentStyle === 'tab'
        ? '\t'
        : ' '.repeat(options.indentSize);

    const lines = code.split('\n');
    let level = 0;
    const formatted: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '') {
            formatted.push('');
            continue;
        }

        if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
            level = Math.max(0, level - 1);
        }

        formatted.push(indent.repeat(level) + line);

        if (line.endsWith('{') || line.endsWith('[') || line.endsWith('(')) {
            level++;
        }
    }

    return formatted.join('\n');
}

/**
 * Model Member Accessors Parser.
 * Scans Eloquent model legacy get*Attribute and modern Attribute return methods.
 *
 * @module core/compiler/scanner/subscanners/model
 */

import type { ParsedAccessor } from "../../../../types/route";
import type { TokenDescriptor } from "../../LaravelSourceLexer";
import { ScannedModelAccessorDescriptor } from "../../descriptors/modelDescriptors";

type AccessorReturnType =
    | 'textual'
    | 'numeric'
    | 'boolean'
    | 'array';

function parseAccessorReturnType(value: string): AccessorReturnType {
    switch (value.toLowerCase()) {
        case 'float':
        case 'int':
        case 'integer':
        case 'number': return 'numeric';
        case 'bool':
        case 'boolean': return 'boolean';
        case 'array': return 'array';
        default: return 'textual';
    }
}

function accessorTypeName(type: AccessorReturnType): 'string' | 'number' | 'boolean' | 'array' {
    switch (type) {
        case 'textual': return 'string';
        case 'numeric': return 'number';
        case 'boolean': return 'boolean';
        case 'array': return 'array';
    }
}

export function tryParseModelAccessors(
    tokens: readonly TokenDescriptor[],
    i: number,
    accessors: ParsedAccessor[]
): void {
    const token = tokens[i];

    // 1. Legacy style: public function getSubtotalAttribute(): float { ... }
    if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER' && tokens[i + 1].value.startsWith('get') && tokens[i + 1].value.endsWith('Attribute')) {
        const fnName = tokens[i + 1].value;
        const rawName = fnName.slice(3, -9);
        const accName = rawName.charAt(0).toLowerCase() + rawName.slice(1);
        let accType: AccessorReturnType = 'textual';
        let k = i + 2;
        while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') {
            if (tokens[k].value === ':') {
                const hint = tokens[k + 1]?.value?.toLowerCase();
                accType = parseAccessorReturnType(hint);
            }
            k++;
        }
        accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: accName, type: accessorTypeName(accType), nullable: false }));
    }

    // 2. Modern style: protected function amountMinor(): Attribute { return Attribute::make(get: fn () => ...); }
    if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
        const fnName = tokens[i + 1].value;
        let k = i + 2;
        let isAttribute = false;
        while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') {
            if (tokens[k].value === ':' && tokens[k + 1]?.value === 'Attribute') {
                isAttribute = true;
            }
            k++;
        }

        if (isAttribute && tokens[k]?.value === '{') {
            let depth = 1;
            k++;
            let accType: AccessorReturnType = 'textual';
            while (k < tokens.length && depth > 0) {
                if (tokens[k].value === '{') depth++;
                else if (tokens[k].value === '}') depth--;

                if (tokens[k].value === '(' && (tokens[k + 1]?.value === 'int' || tokens[k + 1]?.value === 'integer' || tokens[k + 1]?.value === 'float') && tokens[k + 2]?.value === ')') {
                    accType = 'numeric';
                }
                k++;
            }
            accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: fnName, type: accessorTypeName(accType), nullable: false }));
        }
    }
}

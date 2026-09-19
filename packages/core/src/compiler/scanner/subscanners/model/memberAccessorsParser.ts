/**
 * Model Member Accessors Parser.
 * Scans Eloquent model legacy get*Attribute and modern Attribute return methods.
 *
 * @module core/compiler/scanner/subscanners/model
 */

import type { ParsedAccessor } from "../../../../types/route";
import type { TokenDescriptor } from "../../LaravelSourceLexer";
import { classifyAstTokens } from "../../lexer/astClassifier";
import { mapModelAccessorReturnExpression } from "./modelAccessorExpressionMapper";
import { ScannedModelAccessorDescriptor } from "../../descriptors/modelDescriptors";
import { PrimitiveKind, PrimitiveType, JsonValueType } from "../../../types/SemanticType";

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

function accessorSemanticType(type: AccessorReturnType): PrimitiveType {
    switch (type) {
        case 'textual': return new PrimitiveType(PrimitiveKind.STRING);
        case 'numeric': return new PrimitiveType(PrimitiveKind.NUMBER);
        case 'boolean': return new PrimitiveType(PrimitiveKind.BOOLEAN);
        case 'array': return new JsonValueType();
    }
}

function parseReturnComputation(
    tokens: readonly TokenDescriptor[],
    bodyStart: number,
    bodyEnd: number,
    result: PrimitiveType | JsonValueType
): import("../../../../types/domain/eloquentTypes").ModelAccessorComputation {
    const returnIndex = tokens.findIndex((token, index) => index >= bodyStart && index < bodyEnd && token.value === 'return');
    if (returnIndex < 0) return { kind: 'rejected', reason: 'missing_return_expression', result };
    const expressionTokens: TokenDescriptor[] = [];
    let depth = 0;
    for (let k = returnIndex + 1; k < bodyEnd; k++) {
        const token = tokens[k];
        if (token.value === '(' || token.value === '[' || token.value === '{') depth++;
        if (token.value === ')' || token.value === ']' || token.value === '}') depth--;
        if (token.value === ';' && depth === 0) break;
        expressionTokens.push(token);
    }
    if (expressionTokens.length === 0) return { kind: 'rejected', reason: 'missing_return_expression', result };
    const ast = classifyAstTokens(expressionTokens);
    return { kind: 'expression', expression: mapModelAccessorReturnExpression(ast), result };
}

function findBodyEnd(tokens: readonly TokenDescriptor[], bodyStart: number): number {
    let depth = 1;
    for (let k = bodyStart + 1; k < tokens.length; k++) {
        if (tokens[k].value === '{') depth++;
        if (tokens[k].value === '}') depth--;
        if (depth === 0) return k;
    }
    return tokens.length;
}

export function tryParseModelAccessors(
    source: string,
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
        accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: accName, propertyName: accName, computation: parseReturnComputation(tokens, k + 1, findBodyEnd(tokens, k), accessorSemanticType(accType)) }));
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
            const bodyStart = k + 1;
            const bodyEnd = findBodyEnd(tokens, k);
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
            accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: fnName, propertyName: fnName, computation: parseReturnComputation(tokens, bodyStart, bodyEnd, accessorSemanticType(accType)) }));
        }
    }
}

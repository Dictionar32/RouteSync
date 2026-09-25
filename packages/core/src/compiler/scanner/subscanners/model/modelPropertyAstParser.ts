import type { PhpClassPropertyAst, PhpPropertyVisibility, PhpPropertyStorage, PhpPropertyMutability, PhpPropertyTypeAst, TokenDescriptor } from '../../lexer';
import { createAstIdentifier, createSourceOffset, createSourceLineNumber, classifyAstTokens } from '../../lexer';

const modifierBeforeVariable = (tokens: readonly TokenDescriptor[], index: number, modifier: string): boolean => {
    for (let i = index - 1; i >= 0 && index - i <= 8; i -= 1) {
        const value = tokens[i].value;
        if (value === ';' || value === '{' || value === '}') break;
        if (value === modifier) return true;
    }
    return false;
};

const visibility = (tokens: readonly TokenDescriptor[], index: number): PhpPropertyVisibility => {
    const value = tokens[index - 1]?.value;
    if (value === 'public' || value === 'protected' || value === 'private') return value;
    return 'implicit';
};

const propertyType = (tokens: readonly TokenDescriptor[], index: number): PhpPropertyTypeAst => {
    const parts: string[] = [];
    for (let i = index - 1; i >= 0 && index - i <= 8; i -= 1) {
        const value = tokens[i].value;
        if (value === 'public' || value === 'protected' || value === 'private' || value === 'static' || value === 'readonly' || value === 'var' || value === ';' || value === '{' || value === '}') break;
        parts.unshift(value);
    }
    return parts.length === 0 ? { kind: 'untyped' } : { kind: 'declared', value: parts.join('') };
};

const endOfValue = (tokens: readonly TokenDescriptor[], start: number): number => {
    let depth = 0;
    for (let i = start; i < tokens.length; i += 1) {
        const value = tokens[i].value;
        if (value === '[' || value === '(' || value === '{') depth += 1;
        if (value === ']' || value === ')' || value === '}') depth -= 1;
        if (value === ';' && depth === 0) return i;
    }
    return tokens.length;
};

export function parseModelPropertyAsts(tokens: readonly TokenDescriptor[]): readonly PhpClassPropertyAst[] {
    const result: PhpClassPropertyAst[] = [];
    let classBodyDepth = 0;
    let classBodyOpened = false;
    let depth = 0;
    let classSeen = false;
    for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (token.value === 'class') { classSeen = true; continue; }
        if (token.value === '{') {
            depth += 1;
            if (classSeen && !classBodyOpened) { classBodyDepth = depth; classBodyOpened = true; }
            continue;
        }
        if (token.value === '}') { depth -= 1; continue; }
        if (!classBodyOpened || depth !== classBodyDepth) continue;
        if (token.type !== 'VARIABLE') continue;
        const next = tokens[i + 1]?.value;
        if (next !== '=' && next !== ';') continue;
        const end = next === '=' ? endOfValue(tokens, i + 2) : i + 1;
        const initialized = next === '=';
        const valueTokens = initialized ? tokens.slice(i + 2, end) : [];
        const startToken = tokens[Math.max(0, i - 1)];
        result.push(Object.freeze({
            kind: 'class_property',
            name: createAstIdentifier(token.value.slice(1)),
            visibility: visibility(tokens, i),
            storage: modifierBeforeVariable(tokens, i, 'static') ? 'static' : 'instance',
            mutability: modifierBeforeVariable(tokens, i, 'readonly') ? 'readonly' : 'mutable',
            type: propertyType(tokens, i),
            promotion: { kind: 'declared' },
            initialization: initialized
                ? { kind: 'present', value: classifyAstTokens(valueTokens) }
                : { kind: 'absent' },
            value: initialized ? { kind: 'present', value: classifyAstTokens(valueTokens) } : { kind: 'absent' },
            startOffset: createSourceOffset(startToken?.startOffset ?? token.startOffset),
            endOffset: createSourceOffset(tokens[Math.max(i + 1, end - 1)]?.endOffset ?? token.endOffset),
            startLine: createSourceLineNumber(startToken?.line ?? token.line),
            endLine: createSourceLineNumber(tokens[Math.max(i + 1, end - 1)]?.line ?? token.line)
        }));
        i = end;
    }
    return Object.freeze(result);
}

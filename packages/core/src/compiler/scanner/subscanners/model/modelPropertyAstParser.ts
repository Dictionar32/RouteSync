import type { PhpClassPropertyAst, PhpPropertyVisibility, TokenDescriptor } from '../../lexer';
import { createAstIdentifier, createSourceOffset, createSourceLineNumber, classifyAstTokens } from '../../lexer';

const visibility = (tokens: readonly TokenDescriptor[], index: number): PhpPropertyVisibility => {
    const value = tokens[index - 1]?.value;
    if (value === 'public' || value === 'protected' || value === 'private') return value;
    return 'implicit';
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
    for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        if (token.type !== 'VARIABLE' || tokens[i + 1]?.value !== '=') continue;
        const end = endOfValue(tokens, i + 2);
        const valueTokens = tokens.slice(i + 2, end);
        result.push(Object.freeze({
            kind: 'class_property',
            name: createAstIdentifier(token.value.slice(1)),
            visibility: visibility(tokens, i),
            value: classifyAstTokens(valueTokens),
            startOffset: createSourceOffset(tokens[Math.max(0, i - 1)]?.startOffset ?? token.startOffset),
            endOffset: createSourceOffset(tokens[Math.max(i + 1, end - 1)]?.endOffset ?? token.endOffset),
            startLine: createSourceLineNumber(tokens[Math.max(0, i - 1)]?.line ?? token.line),
            endLine: createSourceLineNumber(tokens[Math.max(i + 1, end - 1)]?.line ?? token.line)
        }));
        i = end;
    }
    return Object.freeze(result);
}

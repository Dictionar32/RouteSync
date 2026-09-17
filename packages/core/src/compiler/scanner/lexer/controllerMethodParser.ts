import type { TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import { parseControllerReturns } from './controllerReturnParser';
import { parseControllerBody } from './controllerBodyParser';
import type {
    ControllerMethodAst,
    ControllerParameterAst,
    PhpParameterTypeAst,
    ResponseAttributeAst,
} from './controllerAstTypes';

export function parseControllerMethod(
    source: string,
    tokens: readonly TokenDescriptor[],
    functionIndex: number
): ControllerMethodAst | undefined {
    const nameToken = tokens[functionIndex + 1];
    if (!nameToken) return undefined;
    const bodyStart = findBodyStart(tokens, functionIndex + 2);
    if (bodyStart < 0) return undefined;
    const bodyEnd = findMatching(tokens, bodyStart, '{', '}');
    if (bodyEnd < 0) return undefined;
    const bodyTokens = tokens.slice(bodyStart + 1, bodyEnd);
    return Object.freeze({
        name: createAstIdentifier(nameToken.value),
        parameters: Object.freeze(parseParameters(tokens, functionIndex + 2)),
        responseAttribute: parseResponseAttribute(tokens, functionIndex),
        returns: Object.freeze(parseControllerReturns(source, bodyTokens)),
        body: parseControllerBody(source, bodyTokens),
        source: tokens[functionIndex],
    });
}

function parseParameters(tokens: readonly TokenDescriptor[], start: number): ControllerParameterAst[] {
    const result: ControllerParameterAst[] = [];
    for (let i = start; i < tokens.length && tokens[i].value !== '{'; i++) {
        const typeToken = tokens[i];
        const nextToken = tokens[i + 1];
        if (!typeToken || !nextToken) continue;
        if (typeToken.value === '?') {
            const innerToken = nextToken;
            const variableToken = tokens[i + 2];
            if (innerToken.type !== 'IDENTIFIER' || variableToken?.type !== 'VARIABLE') continue;
            result.push({
                type: { kind: 'nullable', inner: parseParameterType(innerToken.value) },
                name: createAstIdentifier(variableToken.value.slice(1)),
            });
            i += 2;
            continue;
        }
        if (nextToken.type !== 'VARIABLE' || typeToken.type !== 'IDENTIFIER') continue;
        result.push({
            type: parseParameterType(typeToken.value),
            name: createAstIdentifier(nextToken.value.slice(1)),
        });
    }
    return result;
}

function parseParameterType(value: string): PhpParameterTypeAst {
    switch (value) {
        case 'string':
        case 'int':
        case 'float':
        case 'bool':
        case 'mixed':
            return { kind: 'primitive', name: value };
        default:
            return { kind: 'named', name: createAstIdentifier(value) };
    }
}

function findBodyStart(tokens: readonly TokenDescriptor[], start: number): number {
    for (let i = start; i < tokens.length; i++) {
        if (tokens[i].value === '{') return i;
        if (tokens[i].value === ';') return -1;
    }
    return -1;
}

function findMatching(tokens: readonly TokenDescriptor[], start: number, open: string, close: string): number {
    let depth = 0;
    for (let i = start; i < tokens.length; i++) {
        if (tokens[i].value === open) depth++;
        if (tokens[i].value === close) depth--;
        if (depth === 0) return i;
    }
    return -1;
}

function parseResponseAttribute(tokens: readonly TokenDescriptor[], functionIndex: number): ResponseAttributeAst {
    for (let i = functionIndex - 1; i >= 2; i--) {
        if (tokens[i].value !== 'Response') continue;
        if (tokens[i - 1].value !== '[' || tokens[i - 2].value !== '#') continue;
        const classToken = tokens[i + 2];
        const classScope = tokens[i + 3];
        const classKeyword = tokens[i + 4];
        if (!classToken || classToken.type !== 'IDENTIFIER') continue;
        if (!classScope || classScope.value !== '::') continue;
        if (!classKeyword || classKeyword.value !== 'class') continue;
        const end = findAttributeEnd(tokens, i + 1, functionIndex);
        return {
            kind: 'declared',
            className: createAstIdentifier(classToken.value),
            collection: tokens.slice(i + 1, end).some(token => token.value === 'true'),
        };
    }
    return { kind: 'absent' };
}

function findAttributeEnd(tokens: readonly TokenDescriptor[], start: number, limit: number): number {
    for (let i = start; i < limit; i++) if (tokens[i].value === ']') return i;
    return limit;
}

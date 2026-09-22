import type { PhpAstValue, TokenDescriptor } from './phpAstTypes';
import { classifyAstTokens } from './astClassifier';
import { createAstIdentifier } from './phpAstTypes';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type { RequestName } from '../../../types/upstream/names';
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
    const parameters = parseParameters(tokens, functionIndex + 2);
    const parameterClose = findParameterClose(tokens, functionIndex + 2);
    const declaredReturnType = parseDeclaredReturnType(tokens, parameterClose + 1, bodyStart);
    return Object.freeze({
        name: createAstIdentifier(nameToken.value),
        parameters: Object.freeze(parameters),
        responseAttribute: parseResponseAttribute(tokens, functionIndex),
        declaredReturnType,
        returns: Object.freeze(parseControllerReturns(source, bodyTokens)),
        body: parseControllerBody(
            source,
            bodyTokens,
            parameters.map(parameter => parameter.name),
            new Map(parameters.map(parameter => [parameter.name, parameter.semantic]))
        ),
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
            const name = createAstIdentifier(variableToken.value.slice(1));
            const defaultParse = parseParameterDefault(tokens, i + 3);
            result.push({
                type: { kind: 'nullable', inner: parseParameterType(innerToken.value) },
                defaultValue: defaultParse.value,
                name,
                semantic: parameterSemantic(innerToken.value),
                source: { ...innerToken, endOffset: (defaultParse.endIndex >= 0 ? tokens[defaultParse.endIndex].endOffset : variableToken.endOffset) },
            });
            i = defaultParse.endIndex >= 0 ? defaultParse.endIndex : i + 2;
            continue;
        }
        if (nextToken.type !== 'VARIABLE' || typeToken.type !== 'IDENTIFIER') continue;
        const name = createAstIdentifier(nextToken.value.slice(1));
        const defaultParse = parseParameterDefault(tokens, i + 2);
        result.push({
            type: parseParameterType(typeToken.value),
            defaultValue: defaultParse.value,
            name,
            semantic: parameterSemantic(typeToken.value),
            source: { ...typeToken, endOffset: (defaultParse.endIndex >= 0 ? tokens[defaultParse.endIndex].endOffset : nextToken.endOffset) },
        });
        i = defaultParse.endIndex >= 0 ? defaultParse.endIndex : i + 1;
    }
    return result;
}


function parameterSemantic(typeName: string): ControllerVariableSemantic {
    if (typeName.endsWith('Request') && typeName !== 'Request') {
        const name: RequestName = { kind: 'request_name', value: { kind: 'string_value', value: typeName } };
        return { kind: 'request_origin', name };
    }
    if (typeName === 'string' || typeName === 'int' || typeName === 'float' || typeName === 'bool' || typeName === 'mixed') {
        return { kind: 'external' };
    }
    return { kind: 'model_origin', origin: { kind: 'model_class', name: { kind: 'model_name', value: { kind: 'string_value', value: typeName } } } };
}

function parseParameterType(value: string): PhpParameterTypeAst {
    switch (value) {
        case 'string':
        case 'int':
        case 'float':
        case 'bool':
        case 'mixed':
        case 'array':
            return { kind: 'primitive', name: value };
        default:
            return { kind: 'named', name: createAstIdentifier(value) };
    }
}


function parseParameterDefault(tokens: readonly TokenDescriptor[], start: number): { readonly value: ControllerParameterAst['defaultValue']; readonly endIndex: number } {
    if (tokens[start]?.value !== '=') return { value: { kind: 'absent' }, endIndex: -1 };
    const expression: TokenDescriptor[] = [];
    let depth = 0;
    for (let i = start + 1; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.value === '(' || token.value === '[' || token.value === '{') depth++;
        if (token.value === ')' || token.value === ']' || token.value === '}') {
            if (depth === 0) break;
            depth--;
        }
        if ((token.value === ',' || token.value === ')') && depth === 0) break;
        expression.push(token);
    }
    return expression.length === 0
        ? { value: { kind: 'present', value: { kind: 'unsupported', reason: 'unclassified_expression', tokens: [] } }, endIndex: start }
        : { value: { kind: 'present', value: classifyAstTokens(expression) }, endIndex: start + expression.length };
}

function findParameterClose(tokens: readonly TokenDescriptor[], start: number): number {
    let depth = 0;
    for (let i = start; i < tokens.length; i++) {
        if (tokens[i].value === '(') depth++;
        if (tokens[i].value === ')') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function parseDeclaredReturnType(tokens: readonly TokenDescriptor[], start: number, bodyStart: number): ControllerMethodAst['declaredReturnType'] {
    for (let i = start; i < bodyStart; i++) {
        if (tokens[i].value !== ':') continue;
        const typeToken = tokens[i + 1];
        if (!typeToken) return { kind: 'absent' };
        if (typeToken.value === '?') {
            const inner = tokens[i + 2];
            if (!inner) return { kind: 'absent' };
            return { kind: 'declared', type: { kind: 'nullable', inner: parseParameterType(inner.value) } };
        }
        return { kind: 'declared', type: parseParameterType(typeToken.value) };
    }
    return { kind: 'absent' };
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
            className: createAstIdentifier(resolveImportedClassName(tokens, classToken.value, functionIndex)),
            collection: tokens.slice(i + 1, end).some(token => token.value === 'true'),
        };
    }
    return { kind: 'absent' };
}


function resolveImportedClassName(tokens: readonly TokenDescriptor[], shortName: string, limit: number): string {
    for (let index = 0; index < limit; index++) {
        if (tokens[index].value !== 'use') continue;
        const parts: string[] = [];
        for (let cursor = index + 1; cursor < limit && tokens[cursor].value !== ';'; cursor++) {
            if (tokens[cursor].value === 'as') break;
            if (tokens[cursor].type === 'IDENTIFIER' || tokens[cursor].value === '\\') parts.push(tokens[cursor].value);
        }
        const imported = parts.join('');
        if (imported.endsWith(`\\${shortName}`) || imported === shortName) return imported;
    }
    return shortName;
}

function findAttributeEnd(tokens: readonly TokenDescriptor[], start: number, limit: number): number {
    for (let i = start; i < limit; i++) if (tokens[i].value === ']') return i;
    return limit;
}

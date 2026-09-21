import type { TokenDescriptor } from './phpAstTypes';
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
    return Object.freeze({
        name: createAstIdentifier(nameToken.value),
        parameters: Object.freeze(parameters),
        responseAttribute: parseResponseAttribute(tokens, functionIndex),
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
            result.push({
                type: { kind: 'nullable', inner: parseParameterType(innerToken.value) },
                name,
                semantic: parameterSemantic(innerToken.value),
            });
            i += 2;
            continue;
        }
        if (nextToken.type !== 'VARIABLE' || typeToken.type !== 'IDENTIFIER') continue;
        const name = createAstIdentifier(nextToken.value.slice(1));
        result.push({
            type: parseParameterType(typeToken.value),
            name,
            semantic: parameterSemantic(typeToken.value),
        });
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

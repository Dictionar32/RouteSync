import type { PhpAstValue, TokenDescriptor } from './phpAstTypes';
import { classifyAstTokens } from './astClassifier';
import { createAstIdentifier } from './phpAstTypes';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import { relationAny, relationAll, relationEqual, relationNotEqual } from '../../../semantic/kernel/semanticRelations';
import { relationProject, relationIndexOf, relationGate, relationFold, relationFirst, relationOptionFold, relationRange, relationAdvanceIndex, type RelationOption } from '../../../semantic/kernel/relationalSequence';
import { relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';
import type { RequestName } from '../../../types/upstream/names';
import { parseControllerReturns } from './controllerReturnParser';
import { parseControllerBody } from './controllerBodyParser';
import type {
odAst,
    ControllerParameterAst,
    ControllerParameterAttributeArgumentAst,
    ControllerParameterAttributeAst,
    PhpParameterTypeAst,
    ResponseAttributeAst,
} from './controllerAstTypes';

export function parseControllerMethod(
    source: string,
    tokens: readonly TokenDescriptor[],
    functionIndex: number,
    filePath = '<php-source>'
): RelationOption<ControllerMethodAst> {
    const nameToken = tokens[relationAdvanceIndex(functionIndex, 1)];
    const bodyStart = findBodyStart(tokens, relationAdvanceIndex(functionIndex, 2));
    const bodyEnd = relationGate(bodyStart >= 0, () => findMatching(tokens, bodyStart, '{', '}'), () => -1);
    return relationGate(relationAll([relationEqual(nameToken?.type, 'IDENTIFIER'), bodyStart >= 0, bodyEnd >= 0]), () => {
        const bodyTokens = relationRange(tokens, relationAdvanceIndex(bodyStart, 1), bodyEnd);
        const parameters = parseParameters(tokens, relationAdvanceIndex(functionIndex, 2));
        const parameterClose = findParameterClose(tokens, relationAdvanceIndex(functionIndex, 2));
        const declaredReturnType = parseDeclaredReturnType(tokens, relationAdvanceIndex(parameterClose, 1), bodyStart);
        return Object.freeze({
            name: createAstIdentifier(nameToken.value),
            parameters: Object.freeze(parameters),
            responseAttribute: parseResponseAttribute(tokens, functionIndex),
            declaredReturnType,
            returns: Object.freeze(parseControllerReturns(source, bodyTokens)),
            body: parseControllerBody(
                source,
                bodyTokens,
                relationProject(parameters, parameter => parameter.name),
                relationProject(parameters, parameter => [parameter.name, parameter.semantic] as const),
                filePath
            ),
            source: tokens[functionIndex],
        });
    }, () => ({ kind: 'none' }));
}

function parseParameters(tokens: readonly TokenDescriptor[], start: number): ControllerParameterAst[] {
    const collect = (index: number, output: readonly ControllerParameterAst[]): readonly ControllerParameterAst[] =>
        relationGate(relationAny([index >= tokens.length, relationEqual(tokens[index]?.value, '{')]), () => output, () => {
            const parsedAttributes = parseParameterAttributes(tokens, index);
            const cursor = parsedAttributes.endIndex;
            const typeToken = tokens[cursor];
            const nextToken = tokens[relationAdvanceIndex(cursor, 1)];
            const nullable = relationGate(relationEqual(typeToken?.value, '?'), () => ({ inner: nextToken, variable: tokens[relationAdvanceIndex(cursor, 2)], next: cursor + 3 }), () => ({ inner: typeToken, variable: nextToken, next: cursor + 2 }));
            const valid = relationAll([relationEqual(nullable.inner?.type, 'IDENTIFIER'), relationEqual(nullable.variable?.type, 'VARIABLE')]);
            return relationGate(valid, () => {
                const inner = nullable.inner!;
                const variable = nullable.variable!;
                const defaultParse = parseParameterDefault(tokens, nullable.next);
                const parameter: ControllerParameterAst = {
                    attributes: parsedAttributes.attributes,
                    type: relationGate(relationEqual(typeToken?.value, '?'), () => ({ kind: 'nullable', inner: parseParameterType(inner.value) }), () => parseParameterType(inner.value)),
                    defaultValue: defaultParse.value,
                    name: createAstIdentifier(relationRange(variable.value, 1, variable.value.length)),
                    semantic: parameterSemantic(inner.value),
                    source: { ...inner, endOffset: relationGate(defaultParse.endIndex >= 0, () => tokens[defaultParse.endIndex].endOffset, () => variable.endOffset) },
                };
                const nextIndex = relationGate(defaultParse.endIndex >= 0, () => defaultParse.endIndex + 1, () => nullable.next);
                return collect(nextIndex, [...output, parameter]);
            }, () => collect(relationGate(parsedAttributes.endIndex > index, () => parsedAttributes.endIndex, () => index + 1), output));
        });
    return [...collect(start, [])];
}

export function parseParameterAttributes(tokens: readonly TokenDescriptor[], start: number): { readonly attributes: readonly ControllerParameterAttributeAst[]; readonly endIndex: number } {
    const collect = (index: number, attributes: readonly ControllerParameterAttributeAst[]): { readonly attributes: readonly ControllerParameterAttributeAst[]; readonly endIndex: number } =>
        relationGate(relationAll([relationEqual(tokens[index]?.value, '#'), relationEqual(tokens[relationAdvanceIndex(index, 1)]?.value, '[')]), () => {
            const open = index + 1;
            const close = findMatching(tokens, open, '[', ']');
            return relationGate(close < 0, () => ({ attributes, endIndex: index }), () => {
                const content = relationRange(tokens, relationAdvanceIndex(open, 1), close);
                const nameTokens = collectAttributeNameTokens(content, 0, []);
                return relationGate(relationEqual(nameTokens.length, 0), () => collect(close, attributes), () => collect(close + 1, [...attributes, {
                    name: createAstIdentifier(relationProject(nameTokens, token => token.value).join('')),
                    arguments: Object.freeze(parseAttributeArguments(relationRange(content, nameTokens.length, content.length))),
                    source: { ...tokens[index], endOffset: tokens[close].endOffset },
                }]));
            });
        }, () => ({ attributes: Object.freeze(attributes), endIndex: index }));
    return collect(start, []);
}

function collectAttributeNameTokens(tokens: readonly TokenDescriptor[], index: number, output: readonly TokenDescriptor[]): readonly TokenDescriptor[] {
    return relationGate(relationAll([index < tokens.length, relationAny([relationEqual(tokens[index].type, 'IDENTIFIER'), relationEqual(tokens[index].value, '\\')])]),
        () => collectAttributeNameTokens(tokens, index + 1, [...output, tokens[index]]),
        () => output);
}

function parseAttributeArguments(tokens: readonly TokenDescriptor[]): ControllerParameterAttributeArgumentAst[] {
    return relationGate(relationAny([relationNotEqual(tokens[0]?.value, '('), relationNotEqual(tokens[tokens.length - 1]?.value, ')')]), () => [], () => {
        const inner = relationRange(tokens, 1, relationAdvanceIndex(tokens.length, -1));
        const collect = (index: number, start: number, depth: number, output: readonly ControllerParameterAttributeArgumentAst[]): readonly ControllerParameterAttributeArgumentAst[] =>
            relationGate(index >= inner.length, () => appendAttributePart(relationRange(inner, start, index), output), () => {
                const token = inner[index];
                const nextDepth = depth + (relationGate(relationAny([relationEqual(token.value, '('), relationEqual(token.value, '['), relationEqual(token.value, '{')]), () => 1, () => relationGate(relationAny([relationEqual(token.value, ')'), relationEqual(token.value, ']'), relationEqual(token.value, '}')]), () => -1, () => 0)));
                return relationGate(relationAll([relationEqual(token.value, ','), relationEqual(depth, 0)]), () => collect(index + 1, index + 1, nextDepth, appendAttributePart(relationRange(inner, start, index), output)), () => collect(index + 1, start, nextDepth, output));
            });
        return [...collect(0, 0, 0, [])];
    });
}

function appendAttributePart(part: readonly TokenDescriptor[], output: readonly ControllerParameterAttributeArgumentAst[]): readonly ControllerParameterAttributeArgumentAst[] {
    return relationGate(part.length > 0, () => [...output, parseAttributeArgument(part)], () => output);
}

function parseAttributeArgument(tokens: readonly TokenDescriptor[]): ControllerParameterAttributeArgumentAst {
    const unpacked = relationAll([relationEqual(tokens[0]?.value, '...'), tokens.length > 1]);
    const colonIndex = relationIndexOf(tokens, token => relationEqual(token.value, ':'));
    const named = relationAll([relationEqual(colonIndex, 1), relationEqual(tokens[0]?.type, 'IDENTIFIER')]);
    return relationGate(unpacked, () => ({ kind: 'unpacked', value: classifyAstTokens(relationRange(tokens, 1, tokens.length)) }), () =>
        relationGate(named, () => ({ kind: 'named', name: createAstIdentifier(tokens[0].value), value: classifyAstTokens(relationRange(tokens, 2, tokens.length)) }), () => ({ kind: 'positional', value: classifyAstTokens(tokens) })));
}

function parameterSemantic(typeName: string): ControllerVariableSemantic {
    const requestType = relationGate(relationAny([relationEqual(typeName, 'Request'), typeName.endsWith('Request')]), () => true, () => false);
    return relationGate(requestType, () => {
        const name: RequestName = { kind: 'request_name', value: { kind: 'string_value', value: typeName } };
        return { kind: 'request_origin', name };
    }, () => relationGate(
        ['string', 'int', 'float', 'bool', 'mixed'].includes(typeName),
        () => ({ kind: 'external' }),
        () => ({ kind: 'model_origin', origin: { kind: 'model_class', name: { kind: 'model_name', value: { kind: 'string_value', value: typeName } } } }),
    ));
}

const parameterTypeCatalog: RelationIndex<string, PhpParameterTypeAst> = Object.freeze([
    ['string', { kind: 'primitive', name: 'string' }],
    ['int', { kind: 'primitive', name: 'int' }],
    ['float', { kind: 'primitive', name: 'float' }],
    ['bool', { kind: 'primitive', name: 'bool' }],
    ['mixed', { kind: 'primitive', name: 'mixed' }],
    ['array', { kind: 'primitive', name: 'array' }],
]);
function parseParameterType(value: string): PhpParameterTypeAst {
    return relationOptionFold(relationIndexLookup(parameterTypeCatalog, value), () => ({ kind: 'named', name: createAstIdentifier(value) }), found => found);
}

function parseParameterDefault(tokens: readonly TokenDescriptor[], start: number): { readonly value: ControllerParameterAst['defaultValue']; readonly endIndex: number } {
    return relationGate(relationNotEqual(tokens[start]?.value, '='), () => ({ value: { kind: 'absent' }, endIndex: -1 }), () => {
        const collect = (index: number, depth: number, expression: readonly TokenDescriptor[]): { readonly expression: readonly TokenDescriptor[]; readonly endIndex: number } =>
            relationGate(index >= tokens.length, () => ({ expression, endIndex: start + expression.length }), () => {
                const token = tokens[index];
                const opens = relationAny([relationEqual(token.value, '('), relationEqual(token.value, '['), relationEqual(token.value, '{')]);
                const closes = relationAny([relationEqual(token.value, ')'), relationEqual(token.value, ']'), relationEqual(token.value, '}')]);
                const boundary = relationAll([relationAny([relationEqual(token.value, ','), relationEqual(token.value, ')')]), relationEqual(depth, 0)]);
                return relationGate(boundary, () => ({ expression, endIndex: index - 1 }), () =>
                    relationGate(relationAll([closes, relationEqual(depth, 0)]), () => ({ expression, endIndex: index - 1 }), () =>
                        collect(index + 1, depth + relationGate(opens, () => 1, () => relationGate(closes, () => -1, () => 0)), [...expression, token])));
            });
        const collected = collect(start + 1, 0, []);
        return relationGate(relationEqual(collected.expression.length, 0),
            () => ({ value: { kind: 'present', value: classifyAstTokens([]) }, endIndex: start }),
            () => ({ value: { kind: 'present', value: classifyAstTokens(collected.expression) }, endIndex: collected.endIndex }));
    });
}

function findParameterClose(tokens: readonly TokenDescriptor[], start: number, depth = 0): number {
    return relationGate(start >= tokens.length, () => -1, () => {
        const token = tokens[start];
        const nextDepth = depth + relationGate(relationEqual(token.value, '('), () => 1, () => relationGate(relationEqual(token.value, ')'), () => -1, () => 0));
        return relationGate(relationAll([relationEqual(token.value, ')'), relationEqual(nextDepth, 0)]), () => start, () => findParameterClose(tokens, start + 1, nextDepth));
    });
}

function parseDeclaredReturnType(tokens: readonly TokenDescriptor[], start: number, bodyStart: number): ControllerMethodAst['declaredReturnType'] {
    const index = relationIndexOf(relationRange(tokens, start, bodyStart), token => relationEqual(token.value, ':'));
    return relationGate(index < 0, () => ({ kind: 'absent' }), () => {
        const colon = start + index;
        const typeToken = tokens[colon + 1];
        return relationGate(!typeToken, () => ({ kind: 'absent' }), () => relationGate(relationEqual(typeToken.value, '?'), () => {
            const inner = tokens[colon + 2];
            return relationGate(!inner, () => ({ kind: 'absent' }), () => ({ kind: 'declared', type: { kind: 'nullable', inner: parseParameterType(inner.value) } }));
        }, () => ({ kind: 'declared', type: parseParameterType(typeToken.value) })));
    });
}

function findBodyStart(tokens: readonly TokenDescriptor[], start: number): number {
    return relationGate(start >= tokens.length, () => -1, () => {
        const token = tokens[start];
        return relationGate(relationEqual(token.value, '{'), () => start, () => relationGate(relationEqual(token.value, ';'), () => -1, () => findBodyStart(tokens, start + 1)));
    });
}

function findMatching(tokens: readonly TokenDescriptor[], start: number, open: string, close: string, depth = 0): number {
    return relationGate(start >= tokens.length, () => -1, () => {
        const token = tokens[start];
        const nextDepth = depth + relationGate(relationEqual(token.value, open), () => 1, () => relationGate(relationEqual(token.value, close), () => -1, () => 0));
        return relationGate(relationEqual(nextDepth, 0), () => start, () => findMatching(tokens, start + 1, open, close, nextDepth));
    });
}

function parseResponseAttribute(tokens: readonly TokenDescriptor[], functionIndex: number): ResponseAttributeAst {
    const indexes = relationProject(relationRange(tokens, 2, functionIndex), (_, offset) => functionIndex - 1 - offset);
    const candidate = relationFirst(indexes, index => relationAll([relationEqual(tokens[index]?.value, 'Response'), relationEqual(tokens[index - 1]?.value, '['), relationEqual(tokens[index - 2]?.value, '#')]));
    return relationGate(relationEqual(candidate.kind, 'some'), () => {
        const index = candidate.value;
        const classToken = tokens[index + 2];
        const classScope = tokens[index + 3];
        const classKeyword = tokens[index + 4];
        const valid = relationAll([relationEqual(classToken?.type, 'IDENTIFIER'), relationEqual(classScope?.value, '::'), relationEqual(classKeyword?.value, 'class')]);
        return relationGate(valid, () => {
            const end = findAttributeEnd(tokens, index + 1, functionIndex);
            return { kind: 'declared', className: createAstIdentifier(resolveImportedClassName(tokens, classToken.value, functionIndex)), collection: relationAny(relationProject(relationRange(tokens, relationAdvanceIndex(index, 1), end), token => relationEqual(token.value, 'true'))) };
        }, () => ({ kind: 'absent' }));
    }, () => ({ kind: 'absent' }));
}

function resolveImportedClassName(tokens: readonly TokenDescriptor[], shortName: string, limit: number): string {
    const seek = (index: number): string => relationGate(index < limit, () => {
        const token = tokens[index];
        return relationGate(relationEqual(token.value, 'use'), () => {
            const parts = collectImportParts(tokens, index + 1, limit, []);
            const imported = parts.join('');
            return relationGate(relationAny([imported.endsWith(`\\${shortName}`), relationEqual(imported, shortName)]), () => imported, () => seek(index + 1));
        }, () => seek(index + 1));
    }, () => shortName);
    return seek(0);
}

function collectImportParts(tokens: readonly TokenDescriptor[], index: number, limit: number, parts: readonly string[]): readonly string[] {
    return relationGate(relationAll([index < limit, relationNotEqual(tokens[index].value, ';'), relationNotEqual(tokens[index].value, 'as')]), () => {
        const token = tokens[index];
        const next = relationGate(relationAny([relationEqual(token.type, 'IDENTIFIER'), relationEqual(token.value, '\\')]), () => [...parts, token.value], () => parts);
        return collectImportParts(tokens, index + 1, limit, next);
    }, () => parts);
}

function findAttributeEnd(tokens: readonly TokenDescriptor[], start: number, limit: number): number {
    return relationGate(start < limit, () => relationGate(relationEqual(tokens[start].value, ']'), () => start, () => findAttributeEnd(tokens, start + 1, limit)), () => limit);
}
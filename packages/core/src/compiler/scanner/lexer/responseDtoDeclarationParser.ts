import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import type { ResponseDtoDeclarationAst, ResponseDtoPropertyAst } from './responseDtoAstTypes';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import { createClassName } from '../../../types/upstream/names';
import { relationEqual, relationAll } from '../../../semantic/kernel/semanticRelations';
import { relationFold, relationGate, relationLookup, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../semantic/kernel/relationalSequence';

const primitivePropertyTypes: readonly (readonly [string, TypeExpression])[] = Object.freeze([
    ['string', { kind: 'primitive', value: { kind: 'string' } }],
    ['int', { kind: 'primitive', value: { kind: 'number' } }],
    ['float', { kind: 'primitive', value: { kind: 'number' } }],
    ['bool', { kind: 'primitive', value: { kind: 'boolean' } }],
    ['mixed', { kind: 'mixed' }],
]);

const tokenAt = (tokens: readonly TokenDescriptor[], index: number): RelationOption<TokenDescriptor> =>
    relationLookup(relationFold(tokens, [] as (readonly [number, TokenDescriptor])[], (out, token, offset) => [...out, [offset, token] as const]), index);

const publicProperty = (tokens: readonly TokenDescriptor[], index: number): RelationOption<ResponseDtoPropertyAst> =>
    relationOptionFold(tokenAt(tokens, index), () => relationNone(), visibility =>
        relationOptionFold(tokenAt(tokens, index + 1), () => relationNone(), typeToken =>
            relationOptionFold(tokenAt(tokens, index + 2), () => relationNone(), nameToken =>
                relationGate(
                    relationAll([
                        relationEqual(visibility.value, 'public'),
                        relationEqual(typeToken.type, 'IDENTIFIER'),
                        relationEqual(nameToken.type, 'VARIABLE'),
                    ]),
                    () => relationSome({
                        kind: 'response_dto_property',
                        visibility: 'public',
                        type: parsePropertyType(typeToken.value),
                        name: createAstIdentifier(nameToken.value.substring(1)),
                        source: visibility,
                    }),
                    () => relationNone(),
                ))));

export function parseResponseDtoDeclaration(
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier,
): ResponseDtoDeclarationAst {
    const state = relationFold(
        tokens,
        { properties: [] as ResponseDtoPropertyAst[], index: 0 },
        (current, _token, index) => relationOptionFold(
            publicProperty(tokens, index),
            () => current,
            property => ({ properties: [...current.properties, property], index: index + 2 }),
        ),
    );
    const source = tokenAt(tokens, 0);
    return relationOptionFold(source, () => ({
        kind: 'response_dto_declaration' as const,
        className,
        properties: Object.freeze(state.properties),
        source: tokens[0],
    }), first => ({
        kind: 'response_dto_declaration' as const,
        className,
        properties: Object.freeze(state.properties),
        source: first,
    }));
}

function parsePropertyType(value: string): TypeExpression {
    const nullable = value.startsWith('?');
    const name = value.replace('?', '');
    const base = relationOptionFold(
        relationLookup(primitivePropertyTypes, name),
        () => ({ kind: 'reference' as const, value: { kind: 'class' as const, name: createClassName(createAstIdentifier(name)) } }),
        primitive => primitive,
    );
    return relationGate(
        relationEqual(nullable, true),
        () => ({ kind: 'nullable' as const, value: base }),
        () => base,
    );
}

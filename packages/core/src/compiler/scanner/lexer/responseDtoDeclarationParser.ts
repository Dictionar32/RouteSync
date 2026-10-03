import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import type { PhpPropertyTypeAst, ResponseDtoDeclarationAst, ResponseDtoPropertyAst } from './responseDtoAstTypes';
import { relationEqual, relationAll } from '../../../semantic/kernel/semanticRelations';
import { relationFold, relationGate, relationLookup, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../semantic/kernel/relationalSequence';

const primitivePropertyTypes: readonly (readonly [string, PhpPropertyTypeAst])[] = Object.freeze([
    ['string', { kind: 'primitive', name: 'string', nullable: false }],
    ['int', { kind: 'primitive', name: 'int', nullable: false }],
    ['float', { kind: 'primitive', name: 'float', nullable: false }],
    ['bool', { kind: 'primitive', name: 'bool', nullable: false }],
    ['mixed', { kind: 'mixed', nullable: false }],
]);

const tokenAt = (tokens: readonly TokenDescriptor[], index: number): RelationOption<TokenDescriptor> =>
    relationLookup(relationFold(tokens, [] as (readonly [number, TokenDescriptor])[], (out, token, offset) => [...out, [offset, token] as const]), index);

const publicProperty = (tokens: readonly TokenDescriptor[], index: number): RelationOption<ResponseDtoPropertyAst> =>
    relationOptionFold(tokenAt(tokens, index), () => relationNone(), visibility =>
        relationOptionFold(tokenAt(tokens, index + 1), () => relationNone(), typeToken =>
            relationOptionFold(tokenAt(tokens, index + 2), () => relationNone(), nameToken =>
                relationGate(relationAll([relationEqual(visibility.value, 'public'), relationEqual(typeToken.type, 'IDENTIFIER'), relationEqual(nameToken.type, 'VARIABLE')]), () => relationSome({
                        visibility: 'public',
                        type: parsePropertyType(typeToken.value),
                        name: createAstIdentifier(nameToken.value.substring(1)),
                        source: visibility,
                    }), () => relationNone()))));

export function parseResponseDtoDeclaration(
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier
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
        className,
        properties: Object.freeze(state.properties),
        source: tokens[0] as TokenDescriptor,
    }), first => ({
        className,
        properties: Object.freeze(state.properties),
        source: first,
    }));
}

function parsePropertyType(value: string): PhpPropertyTypeAst {
    const nullable = value.startsWith('?');
    const name = value.replace('?', '');
    return relationOptionFold(
        relationLookup(primitivePropertyTypes, name),
        () => ({ kind: 'named', name: createAstIdentifier(name), nullable }),
        primitive => ({ ...primitive, nullable }),
    );
}

import type { AstIdentifier, TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import type { ResponseDtoDeclarationAst, ResponseDtoPropertyAst, ResponseDtoPropertyTypeEvidence } from './responseDtoAstTypes';
import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import { createClassName } from '../../../types/upstream/names';
import { phpClassNameResolutionContextAt } from './phpClassNameContextParser';
import type { PhpClassNameResolutionContext } from '../../../types/upstream/phpClassNameResolutionInterface';
import { relationFold, relationGate, relationLookup, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../semantic/relations/relationalSequence';

const primitivePropertyTypes: readonly (readonly [string, TypeExpression])[] = Object.freeze([
    ['string', { kind: 'primitive', value: { kind: 'string' } }],
    ['int', { kind: 'primitive', value: { kind: 'integer' } }],
    ['float', { kind: 'primitive', value: { kind: 'decimal' } }],
    ['bool', { kind: 'primitive', value: { kind: 'boolean' } }],
]);

const tokenAt = (tokens: readonly TokenDescriptor[], index: number): RelationOption<TokenDescriptor> =>
    relationLookup(relationFold(tokens, [] as (readonly [number, TokenDescriptor])[], (out, token, offset) => [...out, [offset, token] as const]), index);

const propertyTypeTokens = (tokens: readonly TokenDescriptor[], start: number): Readonly<{ readonly typeTokens: readonly TokenDescriptor[]; readonly variableIndex: number }> => {
    let index = start;
    while (index < tokens.length && tokens[index]?.type !== 'VARIABLE' && ![';', '{', '}', '(', '=', 'function'].includes(tokens[index]?.value ?? '')) index += 1;
    return Object.freeze({ typeTokens: Object.freeze(tokens.slice(start, index)), variableIndex: index });
};

const validClassTypeSyntax = (tokens: readonly TokenDescriptor[]): boolean =>
    tokens.length > 0 && tokens.every(token => token.type === 'IDENTIFIER' || token.value === '?' || token.value === '\\');

const propertyTypeEvidence = (
    tokens: readonly TokenDescriptor[],
    source: TokenDescriptor,
    lexicalContext: PhpClassNameResolutionContext,
): ResponseDtoPropertyTypeEvidence => {
    const raw = tokens.map(token => token.value).join('');
    const nullable = raw.startsWith('?');
    const name = raw.replace(/^\?/, '');
    const primitive = relationOptionFold(relationLookup(primitivePropertyTypes, name), () => undefined, value => value);
    const expression: TypeExpression = primitive ?? (name === 'mixed'
        ? Object.freeze({ kind: 'mixed' as const })
        : Object.freeze({ kind: 'reference' as const, value: { kind: 'class' as const, name: createClassName(name) } }));
    const nullableExpression: TypeExpression = nullable ? Object.freeze({ kind: 'nullable', value: expression }) : expression;
    return relationGate(
        name === 'mixed',
        () => Object.freeze({ kind: 'php_mixed_property_type' as const, expression: { kind: 'mixed' as const }, source }),
        () => relationOptionFold(
            relationLookup(primitivePropertyTypes, name),
            () => relationGate(
                validClassTypeSyntax(tokens) && name.length > 0,
                () => Object.freeze({ kind: 'php_class_reference_property_type' as const, expression: nullableExpression, sourceName: createClassName(name), lexicalContext, source }),
                () => Object.freeze({ kind: 'php_unsupported_property_type_syntax' as const, expression: { kind: 'mixed' as const }, source }),
            ),
            () => Object.freeze({ kind: 'php_primitive_property_type' as const, expression: nullableExpression, source }),
        ),
    );
};

const publicProperty = (
    tokens: readonly TokenDescriptor[],
    index: number,
    lexicalContext: PhpClassNameResolutionContext,
): RelationOption<ResponseDtoPropertyAst> => {
    const visibility = tokens[index];
    const parsedType = propertyTypeTokens(tokens, index + 1);
    const nameToken = tokens[parsedType.variableIndex];
    const isProperty = visibility?.value === 'public' && nameToken?.type === 'VARIABLE' && parsedType.typeTokens.length > 0;
    return relationGate(
        isProperty,
        () => relationOptionFold(
            tokenAt(parsedType.typeTokens, 0),
            () => relationNone(),
            typeSource => {
                const typeEvidence = propertyTypeEvidence(parsedType.typeTokens, typeSource, lexicalContext);
                return relationSome(Object.freeze({
                    kind: 'response_dto_property' as const,
                    visibility: 'public' as const,
                    type: typeEvidence.expression,
                    typeEvidence,
                    name: createAstIdentifier(nameToken.value.substring(1)),
                    source: visibility,
                }));
            },
        ),
        () => relationNone(),
    );
};

export function parseResponseDtoDeclaration(
    tokens: readonly TokenDescriptor[],
    className: AstIdentifier,
): ResponseDtoDeclarationAst {
    const classIndex = tokens.findIndex(token => token.type === 'IDENTIFIER' && token.value === 'class');
    const lexicalContext = phpClassNameResolutionContextAt(tokens, classIndex < 0 ? tokens.length : classIndex);
    const state = relationFold(
        tokens,
        { properties: [] as ResponseDtoPropertyAst[], index: 0 },
        (current, _token, index) => relationOptionFold(
            publicProperty(tokens, index, lexicalContext),
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


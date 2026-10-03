import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationContains } from '../../../../semantic/kernel/relationMembership';
import { relationFirstOption, relationOptionFold, relationExpand, type RelationOption } from '../../../../semantic/kernel/relationalSequence';

import type { TokenDescriptor } from '../phpAstTypes';

/**
 * Declarative lexical vocabulary. Every lookup returns a relation witness;
 * parser absence is represented by the witness domain, not a sentinel.
 */
export type SyntaxTokenKind = TokenDescriptor['type'];

export type SyntaxTokenFact =
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'identifier'; readonly value: string }
  | { readonly kind: 'route'; readonly value: 'Route' }
  | { readonly kind: 'separator'; readonly value: '::' }
  | { readonly kind: 'group'; readonly value: 'group' }
  | { readonly kind: 'statement_end'; readonly value: ';' }
  | { readonly kind: 'comma'; readonly value: ',' }
  | { readonly kind: 'close_paren'; readonly value: ')' }
  | { readonly kind: 'close_bracket'; readonly value: ']' }
  | { readonly kind: 'close_brace'; readonly value: '}' }
  | { readonly kind: 'open_bracket'; readonly value: '[' }
  | { readonly kind: 'open_brace'; readonly value: '{' }
  | { readonly kind: 'arrow'; readonly value: '=>' }
  | { readonly kind: 'open_paren'; readonly value: '(' }
  | { readonly kind: 'class_keyword'; readonly value: 'class' }
  | { readonly kind: 'operation'; readonly value: SyntaxOperation }
  | { readonly kind: 'route_method'; readonly value: SyntaxRouteMethod }
  | { readonly kind: 'route_constraint_method'; readonly value: SyntaxRouteConstraintMethod }
  | { readonly kind: 'resource_method'; readonly value: SyntaxResourceMethod }
  | { readonly kind: 'value'; readonly value: string };

export type SyntaxOperation =
  | 'withTrashed' | 'only' | 'except' | 'names' | 'parameters' | 'scoped'
  | 'shallow' | 'creatable' | 'destroyable' | 'middleware' | 'middlewareFor'
  | 'withoutMiddlewareFor' | 'missing';

export type SyntaxRouteMethod =
  | 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'
  | 'match' | 'any' | 'apiResource';

export type SyntaxRouteConstraintMethod =
  | 'where' | 'whereNumber' | 'whereAlpha' | 'whereAlphaNumeric'
  | 'whereUuid' | 'whereUlid' | 'whereIn';

export type SyntaxResourceMethod =
  | 'resource' | 'apiResource' | 'singleton' | 'apiSingleton';

type Catalog<T> = readonly (readonly [string, T])[];

const routeMethodValues: Catalog<SyntaxRouteMethod> = Object.freeze([
  ['get', 'get'], ['post', 'post'], ['put', 'put'], ['patch', 'patch'], ['delete', 'delete'],
  ['options', 'options'], ['head', 'head'], ['match', 'match'], ['any', 'any'], ['apiResource', 'apiResource'],
]);

const routeConstraintMethodValues: Catalog<SyntaxRouteConstraintMethod> = Object.freeze([
  ['where', 'where'], ['whereNumber', 'whereNumber'], ['whereAlpha', 'whereAlpha'],
  ['whereAlphaNumeric', 'whereAlphaNumeric'], ['whereUuid', 'whereUuid'], ['whereUlid', 'whereUlid'], ['whereIn', 'whereIn'],
]);

const resourceMethodValues: Catalog<SyntaxResourceMethod> = Object.freeze([
  ['resource', 'resource'], ['apiResource', 'apiResource'], ['singleton', 'singleton'], ['apiSingleton', 'apiSingleton'],
]);

const operationValues: Catalog<SyntaxOperation> = Object.freeze([
  ['withTrashed', 'withTrashed'], ['only', 'only'], ['except', 'except'],
  ['names', 'names'], ['parameters', 'parameters'], ['scoped', 'scoped'],
  ['shallow', 'shallow'], ['creatable', 'creatable'], ['destroyable', 'destroyable'],
  ['middleware', 'middleware'], ['middlewareFor', 'middlewareFor'],
  ['withoutMiddlewareFor', 'withoutMiddlewareFor'], ['missing', 'missing'],
]);

const tokenKindValues: Catalog<'string' | 'identifier'> = Object.freeze([
  ['STRING', 'string'], ['IDENTIFIER', 'identifier'],
]);

type LexicalFact = Exclude<SyntaxTokenFact, { kind: 'string' | 'identifier' | 'operation' | 'route_method' | 'route_constraint_method' | 'resource_method' }>;
const VALUE_FACTS: Catalog<LexicalFact> = Object.freeze([
  ['Route', { kind: 'route', value: 'Route' }],
  ['::', { kind: 'separator', value: '::' }],
  ['group', { kind: 'group', value: 'group' }],
  [';', { kind: 'statement_end', value: ';' }],
  [',', { kind: 'comma', value: ',' }],
  [')', { kind: 'close_paren', value: ')' }],
  [']', { kind: 'close_bracket', value: ']' }],
  ['}', { kind: 'close_brace', value: '}' }],
  ['[', { kind: 'open_bracket', value: '[' }],
  ['{', { kind: 'open_brace', value: '{' }],
  ['=>', { kind: 'arrow', value: '=>' }],
  ['(', { kind: 'open_paren', value: '(' }],
  ['class', { kind: 'class_keyword', value: 'class' }],
]);

export const SYNTAX_KIND_GROUPS: Readonly<{
  readonly strings: readonly SyntaxTokenFact['kind'][];
  readonly identifiers: readonly SyntaxTokenFact['kind'][];
  readonly routeRoots: readonly SyntaxTokenFact['kind'][];
  readonly separators: readonly SyntaxTokenFact['kind'][];
  readonly groups: readonly SyntaxTokenFact['kind'][];
  readonly statementEnds: readonly SyntaxTokenFact['kind'][];
  readonly commas: readonly SyntaxTokenFact['kind'][];
  readonly openParens: readonly SyntaxTokenFact['kind'][];
  readonly closeParens: readonly SyntaxTokenFact['kind'][];
  readonly arrows: readonly SyntaxTokenFact['kind'][];
  readonly classKeywords: readonly SyntaxTokenFact['kind'][];
  readonly arrayOpeners: readonly SyntaxTokenFact['kind'][];
  readonly arrayClosers: readonly SyntaxTokenFact['kind'][];
}> = Object.freeze({
  strings: Object.freeze(['string']), identifiers: Object.freeze(['identifier']), routeRoots: Object.freeze(['route']),
  separators: Object.freeze(['separator']), groups: Object.freeze(['group']), statementEnds: Object.freeze(['statement_end']),
  commas: Object.freeze(['comma']), openParens: Object.freeze(['open_paren']), closeParens: Object.freeze(['close_paren']),
  arrows: Object.freeze(['arrow']), classKeywords: Object.freeze(['class_keyword']),
  arrayOpeners: Object.freeze(['open_bracket', 'open_brace']), arrayClosers: Object.freeze(['close_bracket', 'close_brace']),
});

export const SYNTAX_OPERATION_GROUPS: Readonly<{
  readonly withTrashed: readonly SyntaxOperation[]; readonly actionFilters: readonly SyntaxOperation[]; readonly pairMaps: readonly SyntaxOperation[];
  readonly scoped: readonly SyntaxOperation[]; readonly resourceActions: readonly SyntaxOperation[]; readonly names: readonly SyntaxOperation[];
  readonly parameters: readonly SyntaxOperation[]; readonly shallow: readonly SyntaxOperation[]; readonly creatable: readonly SyntaxOperation[];
  readonly destroyable: readonly SyntaxOperation[]; readonly middlewareFor: readonly SyntaxOperation[]; readonly withoutMiddlewareFor: readonly SyntaxOperation[];
  readonly middleware: readonly SyntaxOperation[]; readonly missing: readonly SyntaxOperation[];
}> = Object.freeze({
  withTrashed: Object.freeze(['withTrashed']), actionFilters: Object.freeze(['only', 'except']), pairMaps: Object.freeze(['names', 'parameters']),
  scoped: Object.freeze(['scoped']), resourceActions: Object.freeze(['shallow', 'creatable', 'destroyable']), names: Object.freeze(['names']),
  parameters: Object.freeze(['parameters']), shallow: Object.freeze(['shallow']), creatable: Object.freeze(['creatable']), destroyable: Object.freeze(['destroyable']),
  middlewareFor: Object.freeze(['middlewareFor']), withoutMiddlewareFor: Object.freeze(['withoutMiddlewareFor']),
  middleware: Object.freeze(['middleware', 'middlewareFor', 'withoutMiddlewareFor']), missing: Object.freeze(['missing']),
});

const lookupValue = <T>(catalog: Catalog<T>, key: string): RelationOption<T> => {
  const entry = relationFirstOption(catalog, candidate => relationEqual(candidate[0], key));
  return relationOptionFold(
    entry,
    () => ({ kind: 'none' }),
    candidate => ({ kind: 'some', value: candidate[1] }),
  );
};

const lexicalFact = (token: TokenDescriptor): RelationOption<SyntaxTokenFact> => {
  const kind = lookupValue(tokenKindValues, token.type);
  return relationOptionFold(kind, () => ({ kind: 'none' }), value => ({ kind: 'some', value: { kind: value, value: token.value } }));
};

const factFromRouteMethod = (token: TokenDescriptor): RelationOption<SyntaxTokenFact> =>
  relationOptionFold(lookupValue(routeMethodValues, token.value), () => ({ kind: 'none' }), value => ({ kind: 'some', value: { kind: 'route_method', value } }));

const factFromConstraintMethod = (token: TokenDescriptor): RelationOption<SyntaxTokenFact> =>
  relationOptionFold(lookupValue(routeConstraintMethodValues, token.value), () => ({ kind: 'none' }), value => ({ kind: 'some', value: { kind: 'route_constraint_method', value } }));

const factFromResourceMethod = (token: TokenDescriptor): RelationOption<SyntaxTokenFact> =>
  relationOptionFold(lookupValue(resourceMethodValues, token.value), () => ({ kind: 'none' }), value => ({ kind: 'some', value: { kind: 'resource_method', value } }));

const factCandidates = (token: TokenDescriptor): readonly SyntaxTokenFact[] => {
  const candidates: RelationOption<SyntaxTokenFact>[] = [
    factFromRouteMethod(token),
    factFromConstraintMethod(token),
    factFromResourceMethod(token),
    lookupValue(VALUE_FACTS, token.value),
    lexicalFact(token),
  ];
  return Object.freeze(relationExpand(candidates, entry => relationOptionFold(entry, () => [], value => [value])));
};

export const tokenSyntaxFact = (token: TokenDescriptor): RelationOption<SyntaxTokenFact> =>
  relationFirstOption(factCandidates(token), () => true);

export const tokenKind = (token: TokenDescriptor): RelationOption<SyntaxTokenKind> =>
  ({ kind: 'some', value: token.type });

export const tokenValue = (token: TokenDescriptor): RelationOption<string> =>
  ({ kind: 'some', value: token.value });

const tokenMappedValue = <T>(token: TokenDescriptor, catalog: Catalog<T>): RelationOption<T> => lookupValue(catalog, token.value);

export const tokenOperation = (token: TokenDescriptor): RelationOption<SyntaxOperation> => tokenMappedValue(token, operationValues);
export const tokenRouteMethod = (token: TokenDescriptor): RelationOption<SyntaxRouteMethod> => tokenMappedValue(token, routeMethodValues);
export const tokenRouteConstraintMethod = (token: TokenDescriptor): RelationOption<SyntaxRouteConstraintMethod> => tokenMappedValue(token, routeConstraintMethodValues);
export const tokenResourceMethod = (token: TokenDescriptor): RelationOption<SyntaxResourceMethod> => tokenMappedValue(token, resourceMethodValues);

export const tokenHasKind = (token: TokenDescriptor, kinds: readonly SyntaxTokenFact['kind'][]): boolean =>
  relationOptionFold(tokenSyntaxFact(token), () => false, fact => relationContains(kinds, fact.kind));

export const tokenHasOperation = (token: TokenDescriptor, operations: readonly SyntaxOperation[]): boolean =>
  relationOptionFold(tokenOperation(token), () => false, value => relationContains(operations, value));

export const tokenHasResourceMethod = (token: TokenDescriptor, methods: readonly SyntaxResourceMethod[]): boolean =>
  relationOptionFold(tokenResourceMethod(token), () => false, value => relationContains(methods, value));

export const TOKEN_VALUE_FACTS = Object.freeze({
  route: 'Route', separator: '::', group: 'group', close: '}', open: '{', comma: ',', arrow: '=>', classKeyword: 'class',
});

import { relationAll, relationAny, relationNormalizeWhitespace, relationNotEqual } from '../../../../semantic/relations/semanticRelations';
import { relationContains, relationUnique } from '../../../../semantic/relations/relationMembership';
import { relationResolve } from '../../../relational/sequence';
import { relationFirst, relationOptionMap, relationOptionFold, relationVariantFold, relationEqual } from '../../../../semantic/relations/relationalSequence';
import { projectRelation, selectRelation, expandRelation, accumulateRelation } from '../../../relational/sequence';
import { relationFirstOr } from '../../../../semantic/relations/relationalSequence';
import { routeConstraintArgumentAstFactory, routeConstraintValueAstFactory, routeConstraintParameterAstFactory, type LaravelRouteMethod, type LaravelRouteTargetMethod, type RouteConstraintMethodAst, type RouteTargetAst, type RouteConstraintArgumentAst, type RouteConstraintValueAst, type RouteConstraintParameterAst, } from './routeDeclarationAst';
import { createRouteParameterName, stringValue as semanticStringValue } from '../../../../types/upstream/names';
import type { RouteGroupConstraintFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteConstraintArgument } from '../../../../types/upstream/routeConstraints';
import type { RouteResourceMethodAst } from './routeResourceDeclarationAst';
import type { AstIdentifier, TokenDescriptor } from '../phpAstTypes';
import { createAstIdentifier } from '../phpAstCoreTypes';
import { TokenCursor } from './relationalSyntaxCursor';
import { absent, present, presenceFold, presenceOf, isPresent, type Presence } from '../../../../types/upstream/presence';
import { SYNTAX_KIND_GROUPS, syntaxValueOperations } from './syntaxValue';
/** Laravel syntax vocabulary. Meaning lives here; parsers consume typed facts. */
type CatalogEntry<T> = readonly [
    string,
    T
];
type Catalog<T> = readonly CatalogEntry<T>[];
const ROUTE_METHODS: Catalog<LaravelRouteMethod> = Object.freeze([
    ['get', 'get'], ['post', 'post'], ['put', 'put'], ['patch', 'patch'], ['delete', 'delete'],
    ['options', 'options'], ['head', 'head'], ['query', 'query'], ['match', 'match'], ['any', 'any'],
  ['resource', 'resource'], ['apiResource', 'apiResource'], ['singleton', 'singleton'], ['apiSingleton', 'apiSingleton'],
]);
const ROUTE_CONSTRAINT_METHODS: Catalog<RouteConstraintMethodAst> = Object.freeze([
    ['where', 'where'], ['whereNumber', 'whereNumber'], ['whereAlpha', 'whereAlpha'],
    ['whereAlphaNumeric', 'whereAlphaNumeric'], ['whereUuid', 'whereUuid'], ['whereUlid', 'whereUlid'], ['whereIn', 'whereIn'],
]);
const RESOURCE_METHODS: Catalog<RouteResourceMethodAst> = Object.freeze([
    ['resource', 'resource'], ['apiResource', 'apiResource'], ['singleton', 'singleton'], ['apiSingleton', 'apiSingleton'],
]);
const catalogLookup = <T>(catalog: Catalog<T>, value: Presence<string>): Presence<T> => presenceFold(value, () => absent<T>(), key => relationOptionFold(relationOptionMap(relationFirst(catalog, ([entry]) => Object.is(entry, key)), ([, entry]) => entry), () => absent<T>(), entry => present(entry)));
const catalogValue = <T>(catalog: Catalog<T>, value: Presence<string>): Presence<T> => catalogLookup(catalog, value);
const catalogRequired = <T>(catalog: Catalog<T>, value: Presence<string>): T => presenceFold(value, () => { throw Error('Missing syntax catalog value'); }, key => presenceFold(catalogLookup(catalog, present(key)), () => { throw Error(`Unknown syntax catalog value: ${key}`); }, entry => entry));
export interface RouteMethodLookupOperationInterface {
    readonly lookup: (value: Presence<string>) => Presence<LaravelRouteMethod>;
}
export interface RouteConstraintMethodLookupOperationInterface {
    readonly lookup: (value: Presence<string>) => Presence<RouteConstraintMethodAst>;
}
export interface ResourceMethodLookupOperationInterface {
    readonly lookup: (value: Presence<string>) => Presence<RouteResourceMethodAst>;
}

/** Domain-owned lookup operations replace function-shaped runtime exports. */
export const routeMethodLookupOperation: RouteMethodLookupOperationInterface = Object.freeze({
    lookup: (value: Presence<string>) => catalogValue(ROUTE_METHODS, value),
});
export const routeConstraintMethodLookupOperation: RouteConstraintMethodLookupOperationInterface = Object.freeze({
    lookup: (value: Presence<string>) => catalogValue(ROUTE_CONSTRAINT_METHODS, value),
});
export const resourceMethodLookupOperation: ResourceMethodLookupOperationInterface = Object.freeze({
    lookup: (value: Presence<string>) => catalogValue(RESOURCE_METHODS, value),
});
export type RoutePathTokenExpectation = 'string' | 'any';
export type RoutePathTokenActual =
    | { readonly kind: 'string'; readonly value: string }
    | { readonly kind: 'other'; readonly tokenType: TokenDescriptor['type'] }
    | { readonly kind: 'none' };
export interface RoutePathTokenAcceptanceContinuation<Output> {
    readonly string: (actual: RoutePathTokenActual) => Output;
    readonly any: (actual: RoutePathTokenActual) => Output;
}
export interface RoutePathTokenFact {
    readonly kind: 'route_path_token';
    readonly method: LaravelRouteMethod;
    readonly expectation: RoutePathTokenExpectation;
    readonly actual: RoutePathTokenActual;
    readonly continueForAcceptance: <Output>(continuation: RoutePathTokenAcceptanceContinuation<Output>) => Output;
}
export interface RoutePathTokenFactFactoryInterface {
    readonly create: (cursor: TokenCursor, method: LaravelRouteMethod) => RoutePathTokenFact;
}
export interface RoutePathTokenAcceptanceOperationInterface {
    readonly accepts: (cursor: TokenCursor, method: LaravelRouteMethod) => boolean;
}
/** Route-path policy is a closed domain decision, not a generic catalog/relationship lookup. */
const routePathTokenExpectation = (method: LaravelRouteMethod): RoutePathTokenExpectation => {
    switch (method) {
        case 'match':
        case 'any':
            return 'any';
        case 'get':
        case 'post':
        case 'put':
        case 'patch':
        case 'delete':
        case 'options':
        case 'head':
        case 'query':
        case 'resource':
        case 'apiResource':
        case 'singleton':
        case 'apiSingleton':
            return 'string';
    }
};
const createRoutePathTokenFact = (cursor: TokenCursor, method: LaravelRouteMethod): RoutePathTokenFact => {
    const expectation = routePathTokenExpectation(method);
    const actual: RoutePathTokenActual = presenceFold(
        cursor.currentPresence,
        () => Object.freeze({ kind: 'none' as const }),
        token => token.type === 'STRING'
            ? Object.freeze({ kind: 'string' as const, value: token.value })
            : Object.freeze({ kind: 'other' as const, tokenType: token.type }),
    );
    const continueForAcceptance = <Output>(continuation: RoutePathTokenAcceptanceContinuation<Output>): Output =>
        continuation[expectation](actual);
    return Object.freeze({ kind: 'route_path_token', method, expectation, actual, continueForAcceptance });
};
export const routePathTokenFactFactory: RoutePathTokenFactFactoryInterface = Object.freeze({
    create: createRoutePathTokenFact,
});
/** Acceptance is owned by the route-path fact and its expectation, not inferred by a duplicate lookup. */
export const routePathTokenAcceptanceOperation: RoutePathTokenAcceptanceOperationInterface = Object.freeze({
    accepts: (cursor: TokenCursor, method: LaravelRouteMethod) => routePathTokenFactFactory.create(cursor, method).continueForAcceptance({
        string: actual => actual.kind === 'string',
        any: () => true,
    }),
});
export interface RouteResourceMiddlewareSyntaxModel {
    readonly middleware: readonly string[];
    readonly actions: readonly string[];
}
type ResourceMiddlewareMethod = 'middleware' | 'middlewareFor' | 'withoutMiddlewareFor';
interface ResourceMiddlewareArgumentPolicy {
    readonly actionSpans: (cursor: TokenCursor) => readonly {
        readonly start: TokenCursor;
        readonly end: TokenCursor;
    }[];
    readonly middlewareSpans: (cursor: TokenCursor) => readonly {
        readonly start: TokenCursor;
        readonly end: TokenCursor;
    }[];
}
const allArgumentSpans = (cursor: TokenCursor): readonly { readonly start: TokenCursor; readonly end: TokenCursor }[] => presenceFold(cursor.callArgumentSpansPresence, () => Object.freeze([]), value => value);
const noActionSpans = (): readonly { readonly start: TokenCursor; readonly end: TokenCursor }[] => Object.freeze([]);
const firstArgumentSpans = (cursor: TokenCursor): readonly { readonly start: TokenCursor; readonly end: TokenCursor }[] => presenceFold(presenceOf(cursor.firstCallArgumentSpan), () => Object.freeze([]), value => Object.freeze([value]));
const trailingArgumentSpans = (cursor: TokenCursor) => cursor.callTrailingArgumentSpans;
const RESOURCE_MIDDLEWARE_ARGUMENT_POLICIES: Catalog<ResourceMiddlewareArgumentPolicy> = Object.freeze([
    ['middleware', { actionSpans: noActionSpans, middlewareSpans: allArgumentSpans }],
    ['middlewareFor', { actionSpans: firstArgumentSpans, middlewareSpans: trailingArgumentSpans }],
    ['withoutMiddlewareFor', { actionSpans: firstArgumentSpans, middlewareSpans: trailingArgumentSpans }],
]);
const spanStrings = (span: {
    readonly start: TokenCursor;
    readonly end: TokenCursor;
}): readonly string[] => projectRelation(selectRelation(span.start.tokensUntil(span.end), token => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)), token => token.value);
const collectSpanStrings = (spans: readonly {
    readonly start: TokenCursor;
    readonly end: TokenCursor;
}[]): readonly string[] => Object.freeze(expandRelation(spans, spanStrings));
export interface ResourceMiddlewareSyntaxOperationInterface {
    readonly derive: (cursor: TokenCursor, method: ResourceMiddlewareMethod) => RouteResourceMiddlewareSyntaxModel;
}
export const resourceMiddlewareSyntaxOperation: ResourceMiddlewareSyntaxOperationInterface = Object.freeze({
    derive: (cursor: TokenCursor, method: ResourceMiddlewareMethod) => {
    const policy = catalogRequired(RESOURCE_MIDDLEWARE_ARGUMENT_POLICIES, present(method));
    return Object.freeze({
        middleware: collectSpanStrings(policy.middlewareSpans(cursor)),
        actions: collectSpanStrings(policy.actionSpans(cursor)),
    });
    },
});
export interface RouteTargetMethodSet {
    readonly methods: readonly LaravelRouteTargetMethod[];
}
type RouteTargetMethodResolver =
    | { readonly kind: 'identity'; readonly method: LaravelRouteTargetMethod }
    | { readonly kind: 'match_arguments' }
    | { readonly kind: 'empty' };
const routeTargetIdentity = (method: LaravelRouteTargetMethod): RouteTargetMethodResolver => Object.freeze({ kind: 'identity', method });
const routeTargetMatch: RouteTargetMethodResolver = Object.freeze({ kind: 'match_arguments' });
const routeTargetEmpty: RouteTargetMethodResolver = Object.freeze({ kind: 'empty' });
const resolveRouteTargetMethodResolver = (resolver: RouteTargetMethodResolver, start: TokenCursor): readonly LaravelRouteTargetMethod[] =>
    relationVariantFold(resolver, 'identity',
        value => Object.freeze([value.method]),
        residual => relationVariantFold(residual, 'match_arguments',
            () => {
                const methodPresence = projectRelation(start.callArgumentCursor.delimitedElementSpans, (span: { readonly start: TokenCursor; readonly end: TokenCursor }): Presence<LaravelRouteTargetMethod> =>
                    presenceFold(span.start.currentPresence, () => absent<LaravelRouteTargetMethod>(), (token: TokenDescriptor) => relationOptionFold(syntaxValueOperations.tokenRouteTargetMethod(token), () => absent<LaravelRouteTargetMethod>(), value => present(value))));
                const methods = projectRelation(selectRelation(methodPresence, (value: Presence<LaravelRouteTargetMethod>): value is { readonly kind: 'present'; readonly value: LaravelRouteTargetMethod } => isPresent(value)), value => value.value);
                return Object.freeze(relationUnique(methods));
            },
            () => Object.freeze([])),
    );
const ROUTE_TARGET_METHOD_RESOLVERS: Catalog<RouteTargetMethodResolver> = Object.freeze([
    ['get', routeTargetIdentity('get')], ['post', routeTargetIdentity('post')], ['put', routeTargetIdentity('put')], ['patch', routeTargetIdentity('patch')],
    ['delete', routeTargetIdentity('delete')], ['options', routeTargetIdentity('options')], ['head', routeTargetIdentity('head')], ['query', routeTargetIdentity('query')], ['match', routeTargetMatch],
    ['any', routeTargetEmpty],
    ['resource', routeTargetEmpty], ['apiResource', routeTargetEmpty],
    ['singleton', routeTargetEmpty], ['apiSingleton', routeTargetEmpty],
]);
export interface RouteTargetMethodSetOperationInterface {
    readonly resolve: (start: TokenCursor, method: LaravelRouteMethod) => RouteTargetMethodSet;
}
/** Resolves route target methods through a closed strategy relation rather than parser branching. */
export const routeTargetMethodSetOperation: RouteTargetMethodSetOperationInterface = Object.freeze({
    resolve: (start: TokenCursor, method: LaravelRouteMethod) => Object.freeze({ methods: resolveRouteTargetMethodResolver(catalogRequired(ROUTE_TARGET_METHOD_RESOLVERS, present(method)), start) }),
});
export type RouteResourceMiddlewareScopeKind = 'all' | 'only' | 'except';
const RESOURCE_MIDDLEWARE_SCOPE: Catalog<RouteResourceMiddlewareScopeKind> = Object.freeze([
    ['middleware', 'all'], ['middlewareFor', 'only'], ['withoutMiddlewareFor', 'only'],
]);
export interface ResourceMiddlewareScopeOperationInterface {
    readonly resolve: (method: ResourceMiddlewareMethod) => RouteResourceMiddlewareScopeKind;
}
export const resourceMiddlewareScopeOperation: ResourceMiddlewareScopeOperationInterface = Object.freeze({
    resolve: (method: ResourceMiddlewareMethod) => catalogRequired(RESOURCE_MIDDLEWARE_SCOPE, present(method)),
});
/** Canonical route constraint argument ADT; no duplicate parser-local shape. */
export type RouteConstraintSyntaxArgument = RouteConstraintArgumentAst;
export interface RouteConstraintSyntaxFact {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: RouteConstraintParameterAst;
    readonly argument: RouteConstraintSyntaxArgument;
}
const tokenStringValue = (cursor: TokenCursor): Presence<string> => presenceFold(cursor.currentPresence, () => absent<string>(), token => relationOptionFold(syntaxValueOperations.tokenSyntaxFact(token), () => absent<string>(), fact => relationVariantFold(fact, 'string', () => absent<string>(), entry => present(entry.value))));
const arrayArgumentValues = (cursor: TokenCursor): readonly RouteConstraintValueAst[] => {
    const values = projectRelation(cursor.delimitedElementSpans, (span: { readonly start: TokenCursor; readonly end: TokenCursor }): RouteConstraintValueAst => routeConstraintValueAstFactory.create(
        relationNormalizeWhitespace(projectRelation(span.start.tokensUntil(span.end), (token: TokenDescriptor) => token.value).join(''))
    ));
    return Object.freeze(selectRelation(values, value => value.length > 0));
};
type ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst) => Presence<RouteConstraintSyntaxFact>;
const plainConstraint: ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst): Presence<RouteConstraintSyntaxFact> => presenceFold(second,
    () => present(Object.freeze({ method, parameter, argument: routeConstraintArgumentAstFactory.none() })),
    () => absent<RouteConstraintSyntaxFact>(),
);
const stringConstraint: ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst): Presence<RouteConstraintSyntaxFact> => presenceFold(second,
    () => absent<RouteConstraintSyntaxFact>(),
    cursor => presenceFold(tokenStringValue(cursor), () => absent<RouteConstraintSyntaxFact>(), value => present(Object.freeze({
        method, parameter, argument: routeConstraintArgumentAstFactory.pattern(routeConstraintValueAstFactory.create(value)),
    }))),
);
const arrayConstraint: ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst): Presence<RouteConstraintSyntaxFact> => presenceFold(second,
    () => absent<RouteConstraintSyntaxFact>(),
    cursor => {
        const values = arrayArgumentValues(cursor);
        return relationResolve(values.length > 0, () => present(Object.freeze({ method, parameter, argument: routeConstraintArgumentAstFactory.values(values) })), () => absent<RouteConstraintSyntaxFact>());
    },
);
const ROUTE_CONSTRAINT_STRATEGIES: Catalog<ConstraintStrategy> = Object.freeze([
    ['where', stringConstraint], ['whereNumber', plainConstraint], ['whereAlpha', plainConstraint],
    ['whereAlphaNumeric', plainConstraint], ['whereUuid', plainConstraint], ['whereUlid', plainConstraint], ['whereIn', arrayConstraint],
]);
/** Converts a Laravel constraint call into a typed syntax fact; meaning is selected by a declarative strategy catalog. */
const deriveRouteConstraintFact = (cursor: TokenCursor): Presence<RouteConstraintSyntaxFact> => {
    const method = presenceFold(cursor.currentPresence, () => absent<RouteConstraintMethodAst>(), token => relationOptionFold(syntaxValueOperations.tokenRouteConstraintMethod(token), () => absent<RouteConstraintMethodAst>(), value => present(value)));
    const parameter = presenceFold(tokenStringValue(cursor.callArgumentCursor), () => absent<RouteConstraintParameterAst>(), value => present(routeConstraintParameterAstFactory.create(value)));
    const second = cursor.secondCallArgumentPresence;
    const strategy = catalogLookup(ROUTE_CONSTRAINT_STRATEGIES, presenceFold(method, () => absent<string>(), value => present(value)));
    return presenceFold(method, () => absent<RouteConstraintSyntaxFact>(), methodValue =>
        presenceFold(parameter, () => absent<RouteConstraintSyntaxFact>(), parameterValue =>
            presenceFold(strategy, () => absent<RouteConstraintSyntaxFact>(), strategyValue => strategyValue(parameterValue, second, methodValue))));
};
/** Canonical AST is already the semantic fact shape; preserve the closed ADT without remapping. */
export interface RouteConstraintFactOperationInterface { readonly derive: (cursor: TokenCursor) => Presence<RouteConstraintSyntaxFact>; }
export const routeConstraintFactOperation: RouteConstraintFactOperationInterface = Object.freeze({ derive: deriveRouteConstraintFact });
export interface RouteConstraintArgumentAstOperationInterface { readonly project: (argument: RouteConstraintSyntaxArgument) => RouteConstraintArgumentAst; }
export const routeConstraintArgumentAstOperation: RouteConstraintArgumentAstOperationInterface = Object.freeze({ project: (argument: RouteConstraintSyntaxArgument) => argument });
const isGroupWhereImplementation = (cursor: TokenCursor): boolean => {
    const range = cursor.rangeTo(cursor.statementEndCursor);
    const marker = range.start.nextCursor.find((token, at) => relationAny([
        syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.groups),
        relationAll([
            syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.routeRoots),
            presenceFold(at.nextPresence, () => false, (next: TokenDescriptor) => syntaxValueOperations.tokenHasKind(next, SYNTAX_KIND_GROUPS.separators)),
        ]),
        syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.arrayClosers),
        syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.statementEnds),
      ]));
    return presenceFold(presenceOf(marker), () => false, (value: TokenCursor) => presenceFold(value.currentPresence, () => false, (token: TokenDescriptor) => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.groups)));
};
export type RouteGroupBindingScope = 'default' | 'scoped' | 'without_scoped';
export interface RouteGroupStateModel {
    readonly prefix: Presence<string>;
    readonly middleware: readonly string[];
    readonly namePrefix: Presence<string>;
    readonly controller: Presence<string>;
    readonly domain: Presence<string>;
    readonly bindingScope: RouteGroupBindingScope;
    readonly constraints: readonly RouteGroupConstraintFact[];
}
const createEmptyRouteGroupState = (): RouteGroupStateModel => Object.freeze({
    prefix: absent<string>(), middleware: Object.freeze([]), namePrefix: absent<string>(), controller: absent<string>(), domain: absent<string>(), bindingScope: 'default', constraints: Object.freeze([]),
});
export interface EmptyRouteGroupStateFactoryInterface { readonly create: () => RouteGroupStateModel; }
export const emptyRouteGroupStateFactory: EmptyRouteGroupStateFactoryInterface = Object.freeze({ create: createEmptyRouteGroupState });
export interface IsGroupWhereOperationInterface { readonly test: (cursor: TokenCursor) => boolean; }
export const isGroupWhereOperation: IsGroupWhereOperationInterface = Object.freeze({ test: isGroupWhereImplementation });
const GROUP_BINDING_SCOPE: Catalog<RouteGroupBindingScope> = Object.freeze([
    ['scopeBindings', 'scoped'], ['withoutScopedBindings', 'without_scoped'],
]);
const GROUP_PROPERTIES: Catalog<'prefix' | 'middleware' | 'namePrefix' | 'controller' | 'domain'> = Object.freeze([
    ['prefix', 'prefix'], ['middleware', 'middleware'], ['name', 'namePrefix'], ['controller', 'controller'], ['domain', 'domain'],
]);
export interface RouteGroupBindingScopeLookupOperationInterface { readonly lookup: (method: Presence<string>) => Presence<RouteGroupBindingScope>; }
export const routeGroupBindingScopeLookupOperation: RouteGroupBindingScopeLookupOperationInterface = Object.freeze({ lookup: (method: Presence<string>) => catalogValue(GROUP_BINDING_SCOPE, method) });
export interface RouteGroupPropertyLookupOperationInterface { readonly lookup: (method: Presence<string>) => Presence<'prefix' | 'middleware' | 'namePrefix' | 'controller' | 'domain'>; }
export const routeGroupPropertyLookupOperation: RouteGroupPropertyLookupOperationInterface = Object.freeze({ lookup: (method: Presence<string>) => catalogValue(GROUP_PROPERTIES, method) });
const groupConstraintArgument = (argument: RouteConstraintSyntaxArgument): RouteConstraintArgument =>
    relationVariantFold<RouteConstraintSyntaxArgument, 'pattern', RouteConstraintArgument>(argument, 'pattern',
        rest => relationVariantFold<Exclude<RouteConstraintSyntaxArgument, { readonly kind: 'pattern' }>, 'values', RouteConstraintArgument>(rest, 'values',
            () => Object.freeze({ kind: 'none' }),
            values => Object.freeze({ kind: 'values', values: projectRelation(values.values, value => semanticStringValue(value)) })),
        pattern => Object.freeze({ kind: 'pattern', value: semanticStringValue(pattern.value) }));
const groupConstraintFact = (fact: RouteConstraintSyntaxFact): RouteGroupConstraintFact => Object.freeze({
    method: fact.method,
    parameter: createRouteParameterName(fact.parameter),
    argument: groupConstraintArgument(fact.argument),
    source: Object.freeze({ kind: 'group' }),
});
export interface RouteGroupConstraintFactOperationInterface { readonly derive: (cursor: TokenCursor) => Presence<RouteGroupConstraintFact>; }
export const routeGroupConstraintFactOperation: RouteGroupConstraintFactOperationInterface = Object.freeze({ derive: (cursor: TokenCursor) => presenceFold(routeConstraintFactOperation.derive(cursor), () => absent<RouteGroupConstraintFact>(), fact => present(groupConstraintFact(fact))) });
export interface RouteGroupTransitionModel {
    readonly groups: readonly RouteGroupStateModel[];
    readonly pending: RouteGroupStateModel;
}
const ROUTE_GROUP_OPERATIONS: Catalog<'push' | 'pop'> = Object.freeze([['group', 'push'], ['}', 'pop']]);
const pushRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => Object.freeze({ groups: Object.freeze([...groups, pending]), pending: emptyRouteGroupStateFactory.create() });
const popRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => {
    const reversed = [...groups].reverse();
    reversed.shift();
    return Object.freeze({ groups: Object.freeze(reversed.reverse()), pending });
};
const retainRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => Object.freeze({ groups, pending });
const ROUTE_GROUP_TRANSITIONS: Catalog<(groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel) => RouteGroupTransitionModel> = Object.freeze([
    ['push', pushRouteGroup], ['pop', popRouteGroup], ['retain', retainRouteGroup],
]);
export interface AdvanceRouteGroupStateOperationInterface { readonly advance: (value: Presence<string>, groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel) => RouteGroupTransitionModel; }
export const advanceRouteGroupStateOperation: AdvanceRouteGroupStateOperationInterface = Object.freeze({ advance: (value: Presence<string>, groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel) =>
    presenceFold(catalogValue(ROUTE_GROUP_OPERATIONS, value), () => retainRouteGroup(groups, pending), operation =>
        presenceFold(catalogValue(ROUTE_GROUP_TRANSITIONS, present(operation)), () => retainRouteGroup(groups, pending), transition => transition(groups, pending))) });
const groupStringValues = (cursor: TokenCursor): readonly string[] => Object.freeze(expandRelation(allArgumentSpans(cursor), span => projectRelation(selectRelation(span.start.tokensUntil(span.end), token => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)), token => token.value)));
const firstGroupString = (cursor: TokenCursor): Presence<string> => relationOptionFold(relationFirst(groupStringValues(cursor), () => true), () => absent<string>(), value => present(value));
const emptyGroupDelta = (): RouteGroupStateModel => emptyRouteGroupStateFactory.create();
const GROUP_PENDING_FACTS: Catalog<(cursor: TokenCursor) => RouteGroupStateModel> = Object.freeze([
    ['prefix', cursor => ({ ...emptyGroupDelta(), prefix: firstGroupString(cursor) })],
    ['middleware', cursor => ({ ...emptyGroupDelta(), middleware: groupStringValues(cursor) })],
    ['namePrefix', cursor => ({ ...emptyGroupDelta(), namePrefix: firstGroupString(cursor) })],
    ['controller', cursor => ({ ...emptyGroupDelta(), controller: firstGroupString(cursor) })],
    ['domain', cursor => ({ ...emptyGroupDelta(), domain: firstGroupString(cursor) })],
    ['bindingScope', cursor => ({ ...emptyGroupDelta(), bindingScope: presenceFold(routeGroupBindingScopeLookupOperation.lookup(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value))), () => 'default', value => value) })],
    ['constraints', cursor => ({ ...emptyGroupDelta(), constraints: presenceFold(routeGroupConstraintFactOperation.derive(cursor), () => Object.freeze([]), value => Object.freeze([value])) })],
]);
const groupPendingFact = (cursor: TokenCursor): RouteGroupStateModel => {
    type GroupPendingKey = 'prefix' | 'middleware' | 'namePrefix' | 'controller' | 'domain' | 'bindingScope' | 'constraints';
    const propertyReader = routeGroupPropertyLookupOperation.lookup(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value)));
    const bindingReader: Presence<GroupPendingKey> = presenceFold(routeGroupBindingScopeLookupOperation.lookup(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value))), () => absent<GroupPendingKey>(), () => present('bindingScope'));
    const candidates: readonly Presence<GroupPendingKey>[] = [propertyReader, bindingReader, present('constraints')];
    const selected = relationOptionFold(
        relationFirst(candidates, isPresent),
        () => absent<GroupPendingKey>(),
        (value: Presence<GroupPendingKey>) => presenceFold(value, () => absent<GroupPendingKey>(), key => present(key)),
    );
    return presenceFold(selected, () => emptyGroupDelta(), key => catalogRequired(GROUP_PENDING_FACTS, present(key))(cursor));
};
const deriveRouteGroupPendingState = (cursor: TokenCursor, pending: RouteGroupStateModel): RouteGroupStateModel => {
    const fact = groupPendingFact(cursor);
    return Object.freeze({
        prefix: presenceFold(fact.prefix, () => pending.prefix, value => present(value)),
        middleware: Object.freeze([...pending.middleware, ...fact.middleware]),
        namePrefix: presenceFold(fact.namePrefix, () => pending.namePrefix, value => present(value)),
        controller: presenceFold(fact.controller, () => pending.controller, value => present(value)),
        domain: presenceFold(fact.domain, () => pending.domain, value => present(value)),
        bindingScope: relationResolve(Object.is(fact.bindingScope, 'default'), () => pending.bindingScope, () => fact.bindingScope),
        constraints: Object.freeze([...pending.constraints, ...fact.constraints]),
    });
};
type RouteTargetDescription = {
    readonly kind: 'closure';
    readonly action: AstIdentifier;
    readonly returns: readonly [];
} | {
    readonly kind: 'controller_invokable';
    readonly controller: AstIdentifier;
} | {
    readonly kind: 'controller_action';
    readonly controller: AstIdentifier;
    readonly action: AstIdentifier;
} | {
    readonly kind: 'unsupported';
    readonly reason: string;
};
const targetCandidate = (value: RouteTargetDescription): readonly RouteTargetDescription[] => Object.freeze([value]);
const noTargetCandidates = (): readonly RouteTargetDescription[] => Object.freeze([]);
const targetDescriptionCandidates = (route: TokenCursor): readonly RouteTargetDescription[] => {
    const argument = route.secondCallArgumentPresence;
    const invokable = presenceFold(argument, noTargetCandidates, value => presenceFold(value.currentPresence, noTargetCandidates, (target: TokenDescriptor) =>
        relationResolve(relationAll([syntaxValueOperations.tokenHasKind(target, SYNTAX_KIND_GROUPS.identifiers), value.classReference]),
            () => targetCandidate({ kind: 'controller_invokable', controller: targetIdentifier(target.value) }),
            noTargetCandidates)));
    const arrayAction = presenceFold(argument, noTargetCandidates, value =>
        presenceFold(presenceOf(value.firstDelimitedElementCursor), noTargetCandidates, (controllerCursor: TokenCursor) =>
            presenceFold(presenceOf(value.secondDelimitedElementCursor), noTargetCandidates, (actionCursor: TokenCursor) =>
                presenceFold(controllerCursor.currentPresence, noTargetCandidates, (controller: TokenDescriptor) =>
                    presenceFold(actionCursor.currentPresence, noTargetCandidates, (action: TokenDescriptor) =>
                        relationResolve(relationAll([syntaxValueOperations.tokenHasKind(controller, SYNTAX_KIND_GROUPS.identifiers), value.classReference, syntaxValueOperations.tokenHasKind(action, SYNTAX_KIND_GROUPS.strings)]),
                            () => targetCandidate({ kind: 'controller_action', controller: targetIdentifier(controller.value), action: targetIdentifier(action.value) }),
                            noTargetCandidates))))));
    return Object.freeze([...invokable, ...arrayAction]);
};
const targetIdentifier = (value: string): AstIdentifier => createAstIdentifier(value);
const targetDescriptionFallback = (method: LaravelRouteMethod): RouteTargetDescription => Object.freeze({ kind: 'unsupported', reason: `unsupported route target syntax: ${method}` });
const describeRouteTarget = (route: TokenCursor, method: LaravelRouteMethod): RouteTargetDescription => relationFirstOr(targetDescriptionCandidates(route), (candidate: RouteTargetDescription) => relationAny([
    relationEqual(candidate.kind, 'controller_invokable'),
    relationEqual(candidate.kind, 'controller_action'),
]), targetDescriptionFallback(method));
const projectRouteTargetAst = (route: TokenCursor, method: LaravelRouteMethod): RouteTargetAst => {
    const description = routeTargetDescriptionOperation.describe(route, method);
    return relationVariantFold<RouteTargetDescription, 'closure', RouteTargetAst>(description, 'closure',
        rest => relationVariantFold<Exclude<RouteTargetDescription, { readonly kind: 'closure' }>, 'controller_invokable', RouteTargetAst>(rest, 'controller_invokable',
            remaining => relationVariantFold<Exclude<RouteTargetDescription, { readonly kind: 'closure' | 'controller_invokable' }>, 'controller_action', RouteTargetAst>(remaining, 'controller_action',
                unsupported => relationVariantFold<Extract<RouteTargetDescription, { readonly kind: 'unsupported' }>, 'unsupported', RouteTargetAst>(unsupported, 'unsupported',
                    () => ({ kind: 'unsupported', reason: 'unsupported route target' }),
                    value => ({ kind: 'unsupported', reason: value.reason })),
                value => ({ kind: 'controller_action', controller: value.controller, action: value.action })),
            value => ({ kind: 'controller_invokable', controller: value.controller })),
        value => ({ kind: 'closure', action: value.action, returns: [] }));
};
export interface RouteTargetDescriptionOperationInterface { readonly describe: (route: TokenCursor, method: LaravelRouteMethod) => RouteTargetDescription; }
export const routeTargetDescriptionOperation: RouteTargetDescriptionOperationInterface = Object.freeze({ describe: describeRouteTarget });
export interface RouteTargetAstOperationInterface { readonly project: (route: TokenCursor, method: LaravelRouteMethod) => RouteTargetAst; }
export const routeTargetAstOperation: RouteTargetAstOperationInterface = Object.freeze({ project: projectRouteTargetAst });
export interface MergedRouteGroupStateModel {
    readonly prefixes: readonly string[];
    readonly middleware: readonly string[];
    readonly namePrefixes: readonly string[];
    readonly controller: Presence<string>;
    readonly domain: Presence<string>;
    readonly bindingScope: RouteGroupBindingScope;
    readonly constraints: readonly RouteGroupConstraintFact[];
}
const DEFAULT_BINDING_SCOPES = Object.freeze(['default']);
const lastOr = (values: readonly RouteGroupBindingScope[], fallback: RouteGroupBindingScope): RouteGroupBindingScope => accumulateRelation<RouteGroupBindingScope, RouteGroupBindingScope>(values, fallback, (last: RouteGroupBindingScope, value: RouteGroupBindingScope) => relationResolve(Object.is(last, value), () => last, () => value));
const lastPresence = (values: readonly Presence<string>[]): Presence<string> => accumulateRelation<Presence<string>, Presence<string>>(values, absent<string>(), (last: Presence<string>, value: Presence<string>) => presenceFold(value, () => last, (entry: string) => present(entry)));
const mergeRouteGroupStatesImplementation = (groups: readonly RouteGroupStateModel[]): MergedRouteGroupStateModel => {
    const controllers = projectRelation(groups, group => group.controller);
    const domains = projectRelation(groups, group => group.domain);
    const scopes = selectRelation(projectRelation(groups, group => group.bindingScope), value => relationNotEqual(relationContains(DEFAULT_BINDING_SCOPES, value), true));
    return Object.freeze({
        prefixes: Object.freeze(expandRelation(groups, group => presenceFold(group.prefix, () => Object.freeze([]), value => Object.freeze([value])))),
        middleware: Object.freeze(expandRelation(groups, group => group.middleware)),
        namePrefixes: Object.freeze(expandRelation(groups, group => presenceFold(group.namePrefix, () => Object.freeze([]), value => Object.freeze([value])))),
        controller: lastPresence(controllers),
        domain: lastPresence(domains),
        bindingScope: lastOr(scopes, 'default'),
        constraints: Object.freeze(expandRelation(groups, group => group.constraints)),
    });
};
export interface MergeRouteGroupStatesOperationInterface { readonly merge: (groups: readonly RouteGroupStateModel[]) => MergedRouteGroupStateModel; }
export const mergeRouteGroupStatesOperation: MergeRouteGroupStatesOperationInterface = Object.freeze({ merge: mergeRouteGroupStatesImplementation });
export type RouteInvocationRequirement = 'route_root' | 'separator';
export interface RouteInvocationRequirements {
    readonly route_root: boolean;
    readonly separator: boolean;
}
export interface RouteInvocationFact {
    readonly kind: 'route_invocation';
    readonly requirements: RouteInvocationRequirements;
    readonly method: Presence<LaravelRouteMethod>;
}
const routeInvocationRequirements = (cursor: TokenCursor): RouteInvocationRequirements => Object.freeze({
    route_root: presenceFold(cursor.currentPresence, () => false, (token: TokenDescriptor) => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.routeRoots)),
    separator: presenceFold(cursor.nextPresence, () => false, (token: TokenDescriptor) => syntaxValueOperations.tokenHasKind(token, SYNTAX_KIND_GROUPS.separators)),
});
const deriveRouteInvocationFact = (cursor: TokenCursor): RouteInvocationFact => Object.freeze({
    kind: 'route_invocation',
    requirements: routeInvocationRequirements(cursor),
    method: presenceFold(cursor.afterNextPresence, () => absent<LaravelRouteMethod>(), (token: TokenDescriptor) => relationOptionFold(syntaxValueOperations.tokenRouteMethod(token), () => absent<LaravelRouteMethod>(), value => present(value))),
});
const deriveRouteInvocationMethod = (cursor: TokenCursor): Presence<LaravelRouteMethod> => {
    const fact = routeInvocationFactOperation.derive(cursor);
    const valid = relationAll([fact.requirements.route_root, fact.requirements.separator]);
    return relationResolve(valid, () => fact.method, () => absent<LaravelRouteMethod>());
};
export interface RouteInvocationFactOperationInterface { readonly derive: (cursor: TokenCursor) => RouteInvocationFact; }
export const routeInvocationFactOperation: RouteInvocationFactOperationInterface = Object.freeze({ derive: deriveRouteInvocationFact });
export interface RouteInvocationMethodOperationInterface { readonly resolve: (cursor: TokenCursor) => Presence<LaravelRouteMethod>; }
export const routeInvocationMethodOperation: RouteInvocationMethodOperationInterface = Object.freeze({ resolve: deriveRouteInvocationMethod });
export interface RouteGroupPendingStateOperationInterface { readonly advance: (cursor: TokenCursor, pending: RouteGroupStateModel) => RouteGroupStateModel; }
export const routeGroupPendingStateOperation: RouteGroupPendingStateOperationInterface = Object.freeze({ advance: deriveRouteGroupPendingState });

export type RouteSyntaxSemanticRelation =
    | 'syntax_observes_path'
    | 'syntax_observes_constraint'
    | 'syntax_observes_target'
    | 'syntax_observes_invocation';

/** Route-syntax-specific continuation: every fact determines its own proof relation. */
export interface RouteSyntaxSemanticFactProofContinuation<Output> {
    readonly routePath: (value: RoutePathTokenFact) => Output;
    readonly routeConstraint: (value: RouteConstraintSyntaxFact) => Output;
    readonly routeTarget: (value: RouteTargetDescription) => Output;
    readonly routeInvocation: (value: RouteInvocationFact) => Output;
}

export type RouteSyntaxSemanticFact =
    | { readonly kind: 'route_path'; readonly value: RoutePathTokenFact; readonly continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>) => Output }
    | { readonly kind: 'route_constraint'; readonly value: RouteConstraintSyntaxFact; readonly continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>) => Output }
    | { readonly kind: 'route_target'; readonly value: RouteTargetDescription; readonly continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>) => Output }
    | { readonly kind: 'route_invocation'; readonly value: RouteInvocationFact; readonly continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>) => Output };

export interface RouteSyntaxSemanticJudgment {
    readonly kind: 'route_syntax_semantic_judgment';
    readonly source: 'laravel_route_syntax';
    readonly method: LaravelRouteMethod;
    readonly facts: readonly RouteSyntaxSemanticFact[];
    readonly reasoning: 'declarative_relation_catalog';
    readonly closed: true;
}

export interface RouteSyntaxSemanticJudgmentFactoryInterface {
    readonly create: (cursor: TokenCursor, method: LaravelRouteMethod) => RouteSyntaxSemanticJudgment;
}

const routePathSemanticFact = (value: RoutePathTokenFact): RouteSyntaxSemanticFact => Object.freeze({ kind: 'route_path', value, continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>): Output => continuation.routePath(value) });
const routeConstraintSemanticFact = (value: RouteConstraintSyntaxFact): RouteSyntaxSemanticFact => Object.freeze({ kind: 'route_constraint', value, continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>): Output => continuation.routeConstraint(value) });
const routeTargetSemanticFact = (value: RouteTargetDescription): RouteSyntaxSemanticFact => Object.freeze({ kind: 'route_target', value, continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>): Output => continuation.routeTarget(value) });
const routeInvocationSemanticFact = (value: RouteInvocationFact): RouteSyntaxSemanticFact => Object.freeze({ kind: 'route_invocation', value, continueForProofRelation: <Output>(continuation: RouteSyntaxSemanticFactProofContinuation<Output>): Output => continuation.routeInvocation(value) });

const createRouteSyntaxSemanticJudgment = (cursor: TokenCursor, method: LaravelRouteMethod): RouteSyntaxSemanticJudgment => Object.freeze({
    kind: 'route_syntax_semantic_judgment',
    source: 'laravel_route_syntax',
    method,
    facts: Object.freeze([
        routePathSemanticFact(routePathTokenFactFactory.create(cursor, method)),
        ...presenceFold(routeConstraintFactOperation.derive(cursor), () => Object.freeze([]), value => Object.freeze([routeConstraintSemanticFact(value)])),
        routeTargetSemanticFact(routeTargetDescriptionOperation.describe(cursor, method)),
        routeInvocationSemanticFact(routeInvocationFactOperation.derive(cursor)),
    ]),
    reasoning: 'declarative_relation_catalog',
    closed: true,
});

export const routeSyntaxSemanticJudgmentFactory: RouteSyntaxSemanticJudgmentFactoryInterface = Object.freeze({
    create: (cursor: TokenCursor, method: LaravelRouteMethod) => createRouteSyntaxSemanticJudgment(cursor, method),
});

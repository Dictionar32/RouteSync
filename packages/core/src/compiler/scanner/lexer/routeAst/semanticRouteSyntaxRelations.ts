import { relationAll, relationAny, relationNormalizeWhitespace, relationNotEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationContains, relationUnique } from '../../../../semantic/kernel/relationMembership';
import { relationResolve } from '../../../relational/sequence';
import { relationFirst, relationOptionMap, relationOptionFold, relationVariantFold, relationVariantValue, relationEqual } from '../../../../semantic/kernel/relationalSequence';
import { projectRelation, selectRelation, expandRelation, accumulateRelation } from '../../../relational/sequence';
import { relationFirstOr } from '../../../../semantic/kernel/relationalSequence';
import { createRouteConstraintValueAst, createRouteConstraintParameterAst, type LaravelRouteMethod, type RouteConstraintMethodAst, type RouteTargetAst, type RouteConstraintArgumentAst, type RouteConstraintValueAst, type RouteConstraintParameterAst, } from './routeDeclarationAst';
import { createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import type { RouteGroupConstraintFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteConstraintArgument } from '../../../../types/upstream/routeConstraints';
import type { RouteResourceMethodAst } from './routeResourceDeclarationAst';
import type { TokenDescriptor } from '../phpAstTypes';
import { TokenCursor } from '../../../../semantic/kernel/syntax/relationalSyntaxCursor';
import { absent, present, mapPresenceValue, presenceFold, presenceOf, isPresent, type Presence } from '../../../../types/upstream/presence';
import { SYNTAX_KIND_GROUPS, tokenHasKind, tokenHasOperation, tokenRouteMethod, tokenRouteConstraintMethod, tokenResourceMethod, tokenSyntaxFact } from './syntaxValue';
/** Laravel syntax vocabulary. Meaning lives here; parsers consume typed facts. */
type CatalogEntry<T> = readonly [
    string,
    T
];
type Catalog<T> = readonly CatalogEntry<T>[];
const ROUTE_METHODS: Catalog<LaravelRouteMethod> = Object.freeze([
    ['get', 'get'], ['post', 'post'], ['put', 'put'], ['patch', 'patch'], ['delete', 'delete'],
    ['options', 'options'], ['head', 'head'], ['match', 'match'], ['any', 'any'], ['apiResource', 'apiResource'],
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
export const routeMethod = (value: Presence<string>): Presence<LaravelRouteMethod> => catalogValue(ROUTE_METHODS, value);
export const routeConstraintMethod = (value: Presence<string>): Presence<RouteConstraintMethodAst> => catalogValue(ROUTE_CONSTRAINT_METHODS, value);
export const resourceMethod = (value: Presence<string>): Presence<RouteResourceMethodAst> => catalogValue(RESOURCE_METHODS, value);
export type RoutePathTokenExpectation = 'string' | 'any';
export interface RoutePathTokenFact {
    readonly kind: 'route_path_token';
    readonly method: LaravelRouteMethod;
    readonly expectation: RoutePathTokenExpectation;
    readonly actual: ReturnType<typeof tokenSyntaxFact>;
}
interface RoutePathTokenPolicy {
    readonly expectation: RoutePathTokenExpectation;
}
const ROUTE_PATH_TOKEN_POLICIES: Catalog<RoutePathTokenPolicy> = Object.freeze([
    ['get', { expectation: 'string' }], ['post', { expectation: 'string' }],
    ['put', { expectation: 'string' }], ['patch', { expectation: 'string' }],
    ['delete', { expectation: 'string' }], ['options', { expectation: 'string' }],
    ['head', { expectation: 'string' }], ['match', { expectation: 'any' }], ['any', { expectation: 'any' }],
    ['apiResource', { expectation: 'string' }],
]);
const ROUTE_PATH_EXPECTATION_READERS = Object.freeze({
    string: (fact: RoutePathTokenFact) => relationOptionFold(fact.actual, () => false, entry => relationContains(SYNTAX_KIND_GROUPS.strings, entry.kind)),
    any: () => true,
});
export const routePathTokenFact = (cursor: TokenCursor, method: LaravelRouteMethod): RoutePathTokenFact => {
    const policy = catalogRequired(ROUTE_PATH_TOKEN_POLICIES, present(method));
    const actual: ReturnType<typeof tokenSyntaxFact> = presenceFold(cursor.currentPresence, () => ({ kind: 'none' }), token => tokenSyntaxFact(token));
    return Object.freeze({ kind: 'route_path_token', method, expectation: policy.expectation, actual });
};
/** Compatibility projection: the syntax knowledge is stored in RoutePathTokenFact; this is only its boolean projection. */
export const isRoutePathToken = (cursor: TokenCursor, method: LaravelRouteMethod): boolean => ROUTE_PATH_EXPECTATION_READERS[routePathTokenFact(cursor, method).expectation](routePathTokenFact(cursor, method));
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
}): readonly string[] => projectRelation(selectRelation(span.start.tokensUntil(span.end), token => tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)), token => token.value);
const collectSpanStrings = (spans: readonly {
    readonly start: TokenCursor;
    readonly end: TokenCursor;
}[]): readonly string[] => Object.freeze(expandRelation(spans, spanStrings));
export const resourceMiddlewareSyntax = (cursor: TokenCursor, method: ResourceMiddlewareMethod): RouteResourceMiddlewareSyntaxModel => {
    const policy = catalogRequired(RESOURCE_MIDDLEWARE_ARGUMENT_POLICIES, present(method));
    return Object.freeze({
        middleware: collectSpanStrings(policy.middlewareSpans(cursor)),
        actions: collectSpanStrings(policy.actionSpans(cursor)),
    });
};
export interface RouteTargetMethodSet {
    readonly methods: readonly LaravelRouteMethod[];
}
type RouteTargetMethodResolver =
    | { readonly kind: 'identity' }
    | { readonly kind: 'match_arguments' };
const routeTargetDefault: RouteTargetMethodResolver = Object.freeze({ kind: 'identity' });
const routeTargetMatch: RouteTargetMethodResolver = Object.freeze({ kind: 'match_arguments' });
const resolveRouteTargetMethodResolver = (resolver: RouteTargetMethodResolver, start: TokenCursor, method: LaravelRouteMethod): readonly LaravelRouteMethod[] =>
    relationVariantFold(resolver, 'identity',
        () => Object.freeze([method]),
        () => {
            const methodPresence = projectRelation(start.callArgumentCursor.delimitedElementSpans, (span: { readonly start: TokenCursor; readonly end: TokenCursor }): Presence<LaravelRouteMethod> =>
                presenceFold(span.start.currentPresence, () => absent<LaravelRouteMethod>(), (token: TokenDescriptor) => relationOptionFold(tokenRouteMethod(token), () => absent<LaravelRouteMethod>(), value => present(value))));
            const methods = projectRelation(selectRelation(methodPresence, (value: Presence<LaravelRouteMethod>): value is { readonly kind: 'present'; readonly value: LaravelRouteMethod } => isPresent(value)), value => value.value);
            return Object.freeze(relationUnique(methods));
        });
const ROUTE_TARGET_METHOD_RESOLVERS: Catalog<RouteTargetMethodResolver> = Object.freeze([
    ['get', routeTargetDefault], ['post', routeTargetDefault], ['put', routeTargetDefault], ['patch', routeTargetDefault],
    ['delete', routeTargetDefault], ['options', routeTargetDefault], ['head', routeTargetDefault], ['match', routeTargetMatch],
    ['any', routeTargetDefault], ['apiResource', routeTargetDefault],
]);
/** Resolves route target methods through a closed strategy relation rather than parser branching. */
export const routeTargetMethodSet = (start: TokenCursor, method: LaravelRouteMethod): RouteTargetMethodSet => Object.freeze({ methods: resolveRouteTargetMethodResolver(catalogRequired(ROUTE_TARGET_METHOD_RESOLVERS, present(method)), start, method) });
export type RouteResourceMiddlewareScopeKind = 'all' | 'only' | 'except';
const RESOURCE_MIDDLEWARE_SCOPE: Catalog<RouteResourceMiddlewareScopeKind> = Object.freeze([
    ['middleware', 'all'], ['middlewareFor', 'only'], ['withoutMiddlewareFor', 'except'],
]);
export const resourceMiddlewareScope = (method: ResourceMiddlewareMethod): RouteResourceMiddlewareScopeKind => catalogRequired(RESOURCE_MIDDLEWARE_SCOPE, present(method));
/** Canonical route constraint argument ADT; no duplicate parser-local shape. */
export type RouteConstraintSyntaxArgument = RouteConstraintArgumentAst;
export interface RouteConstraintSyntaxFact {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: RouteConstraintParameterAst;
    readonly argument: RouteConstraintSyntaxArgument;
}
const stringValue = (cursor: TokenCursor): Presence<string> => presenceFold(cursor.currentPresence, () => absent<string>(), token => relationOptionFold(tokenSyntaxFact(token), () => absent<string>(), fact => relationVariantFold(fact, 'string', () => absent<string>(), entry => present(entry.value))));
const arrayArgumentValues = (cursor: TokenCursor): readonly RouteConstraintValueAst[] => {
    const values = projectRelation(cursor.delimitedElementSpans, (span: { readonly start: TokenCursor; readonly end: TokenCursor }): RouteConstraintValueAst => createRouteConstraintValueAst(
        relationNormalizeWhitespace(projectRelation(span.start.tokensUntil(span.end), (token: TokenDescriptor) => token.value).join(''))
    ));
    return Object.freeze(selectRelation(values, value => value.length > 0));
};
type ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst) => Presence<RouteConstraintSyntaxFact>;
const plainConstraint: ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst): Presence<RouteConstraintSyntaxFact> => presenceFold(second,
    () => present(Object.freeze({ method, parameter, argument: Object.freeze({ kind: 'none' }) })),
    () => absent<RouteConstraintSyntaxFact>(),
);
const stringConstraint: ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst): Presence<RouteConstraintSyntaxFact> => presenceFold(second,
    () => absent<RouteConstraintSyntaxFact>(),
    cursor => presenceFold(stringValue(cursor), () => absent<RouteConstraintSyntaxFact>(), value => present(Object.freeze({
        method, parameter, argument: Object.freeze({ kind: 'pattern', value: createRouteConstraintValueAst(value) }),
    }))),
);
const arrayConstraint: ConstraintStrategy = (parameter: RouteConstraintParameterAst, second: Presence<TokenCursor>, method: RouteConstraintMethodAst): Presence<RouteConstraintSyntaxFact> => presenceFold(second,
    () => absent<RouteConstraintSyntaxFact>(),
    cursor => {
        const values = arrayArgumentValues(cursor);
        return relationResolve(values.length > 0, () => present(Object.freeze({ method, parameter, argument: Object.freeze({ kind: 'values', values }) })), () => absent<RouteConstraintSyntaxFact>());
    },
);
const ROUTE_CONSTRAINT_STRATEGIES: Catalog<ConstraintStrategy> = Object.freeze([
    ['where', stringConstraint], ['whereNumber', plainConstraint], ['whereAlpha', plainConstraint],
    ['whereAlphaNumeric', plainConstraint], ['whereUuid', plainConstraint], ['whereUlid', plainConstraint], ['whereIn', arrayConstraint],
]);
/** Converts a Laravel constraint call into a typed syntax fact; meaning is selected by a declarative strategy catalog. */
export const routeConstraintFact = (cursor: TokenCursor): Presence<RouteConstraintSyntaxFact> => {
    const method = presenceFold(cursor.currentPresence, () => absent<RouteConstraintMethodAst>(), token => relationOptionFold(tokenRouteConstraintMethod(token), () => absent<RouteConstraintMethodAst>(), value => present(value)));
    const parameter = presenceFold(stringValue(cursor.callArgumentCursor), () => absent<RouteConstraintParameterAst>(), value => present(createRouteConstraintParameterAst(value)));
    const second = cursor.secondCallArgumentPresence;
    const strategy = catalogLookup(ROUTE_CONSTRAINT_STRATEGIES, presenceFold(method, () => absent<string>(), value => present(value)));
    return presenceFold(method, () => absent<RouteConstraintSyntaxFact>(), methodValue =>
        presenceFold(parameter, () => absent<RouteConstraintSyntaxFact>(), parameterValue =>
            presenceFold(strategy, () => absent<RouteConstraintSyntaxFact>(), strategyValue => strategyValue(parameterValue, second, methodValue))));
};
/** Canonical AST is already the semantic fact shape; preserve the closed ADT without remapping. */
export const routeConstraintArgumentAst = (argument: RouteConstraintSyntaxArgument): RouteConstraintArgumentAst => argument;
export const isGroupWhere = (cursor: TokenCursor): boolean => {
    const range = cursor.rangeTo(cursor.statementEndCursor);
    const marker = range.start.nextCursor.find((token, at) => relationAny([
        tokenHasKind(token, SYNTAX_KIND_GROUPS.groups),
        relationAll([
            tokenHasKind(token, SYNTAX_KIND_GROUPS.routeRoots),
            presenceFold(at.nextPresence, () => false, (next: TokenDescriptor) => tokenHasKind(next, SYNTAX_KIND_GROUPS.separators)),
        ]),
        tokenHasKind(token, SYNTAX_KIND_GROUPS.arrayClosers),
        tokenHasKind(token, SYNTAX_KIND_GROUPS.statementEnds),
      ]));
    return presenceFold(presenceOf(marker), () => false, (value: TokenCursor) => presenceFold(value.currentPresence, () => false, (token: TokenDescriptor) => tokenHasKind(token, SYNTAX_KIND_GROUPS.groups)));
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
export const emptyRouteGroupState = (): RouteGroupStateModel => ({
    prefix: absent<string>(), middleware: Object.freeze([]), namePrefix: absent<string>(), controller: absent<string>(), domain: absent<string>(), bindingScope: 'default', constraints: Object.freeze([]),
});
const GROUP_BINDING_SCOPE: Catalog<RouteGroupBindingScope> = Object.freeze([
    ['scopeBindings', 'scoped'], ['withoutScopedBindings', 'without_scoped'],
]);
const GROUP_PROPERTIES: Catalog<'prefix' | 'middleware' | 'namePrefix' | 'controller' | 'domain'> = Object.freeze([
    ['prefix', 'prefix'], ['middleware', 'middleware'], ['name', 'namePrefix'], ['controller', 'controller'], ['domain', 'domain'],
]);
export const routeGroupBindingScope = (method: Presence<string>): Presence<RouteGroupBindingScope> => catalogValue(GROUP_BINDING_SCOPE, method);
export const routeGroupProperty = (method: Presence<string>): Presence<'prefix' | 'middleware' | 'namePrefix' | 'controller' | 'domain'> => catalogValue(GROUP_PROPERTIES, method);
const groupConstraintArgument = (argument: RouteConstraintSyntaxArgument): RouteConstraintArgument =>
    relationVariantFold<RouteConstraintSyntaxArgument, 'pattern', RouteConstraintArgument>(argument, 'pattern',
        () => Object.freeze({ kind: 'none' }),
        rest => relationVariantFold<Exclude<RouteConstraintSyntaxArgument, { readonly kind: 'pattern' }>, 'values', RouteConstraintArgument>(rest, 'values',
            () => Object.freeze({ kind: 'none' }),
            values => Object.freeze({ kind: 'values', values: projectRelation(values.values, stringValue) }),
            none => Object.freeze({ kind: 'none' })),
        pattern => Object.freeze({ kind: 'pattern', value: stringValue(pattern.value) }));
const groupConstraintFact = (fact: RouteConstraintSyntaxFact): RouteGroupConstraintFact => Object.freeze({
    method: fact.method,
    parameter: createRouteParameterName(fact.parameter),
    argument: groupConstraintArgument(fact.argument),
    source: Object.freeze({ kind: 'group' }),
});
export const routeGroupConstraint = (cursor: TokenCursor): Presence<RouteGroupConstraintFact> => presenceFold(routeConstraintFact(cursor), () => absent<RouteGroupConstraintFact>(), fact => present(groupConstraintFact(fact)));
export interface RouteGroupTransitionModel {
    readonly groups: readonly RouteGroupStateModel[];
    readonly pending: RouteGroupStateModel;
}
const ROUTE_GROUP_OPERATIONS: Catalog<'push' | 'pop'> = Object.freeze([['group', 'push'], ['}', 'pop']]);
const pushRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => Object.freeze({ groups: Object.freeze([...groups, pending]), pending: emptyRouteGroupState() });
const popRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => {
    const reversed = [...groups].reverse();
    reversed.shift();
    return Object.freeze({ groups: Object.freeze(reversed.reverse()), pending });
};
const retainRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => Object.freeze({ groups, pending });
const ROUTE_GROUP_TRANSITIONS: Catalog<(groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel) => RouteGroupTransitionModel> = Object.freeze([
    ['push', pushRouteGroup], ['pop', popRouteGroup], ['retain', retainRouteGroup],
]);
export const advanceRouteGroupState = (value: Presence<string>, groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel =>
    presenceFold(catalogValue(ROUTE_GROUP_OPERATIONS, value), () => retainRouteGroup(groups, pending), operation =>
        presenceFold(catalogValue(ROUTE_GROUP_TRANSITIONS, present(operation)), () => retainRouteGroup(groups, pending), transition => transition(groups, pending)));
const groupStringValues = (cursor: TokenCursor): readonly string[] => Object.freeze(expandRelation(allArgumentSpans(cursor), span => projectRelation(selectRelation(span.start.tokensUntil(span.end), token => tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)), token => token.value)));
const firstGroupString = (cursor: TokenCursor): Presence<string> => relationOptionFold(relationFirst(groupStringValues(cursor), () => true), () => absent<string>(), value => present(value));
const emptyGroupDelta = (): RouteGroupStateModel => emptyRouteGroupState();
const GROUP_PENDING_FACTS: Catalog<(cursor: TokenCursor) => RouteGroupStateModel> = Object.freeze([
    ['prefix', cursor => ({ ...emptyGroupDelta(), prefix: firstGroupString(cursor) })],
    ['middleware', cursor => ({ ...emptyGroupDelta(), middleware: groupStringValues(cursor) })],
    ['namePrefix', cursor => ({ ...emptyGroupDelta(), namePrefix: firstGroupString(cursor) })],
    ['controller', cursor => ({ ...emptyGroupDelta(), controller: firstGroupString(cursor) })],
    ['domain', cursor => ({ ...emptyGroupDelta(), domain: firstGroupString(cursor) })],
    ['bindingScope', cursor => ({ ...emptyGroupDelta(), bindingScope: presenceFold(routeGroupBindingScope(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value))), () => 'default', value => value) })],
    ['constraints', cursor => ({ ...emptyGroupDelta(), constraints: presenceFold(routeGroupConstraint(cursor), () => Object.freeze([]), value => Object.freeze([value])) })],
]);
const groupPendingFact = (cursor: TokenCursor): RouteGroupStateModel => {
    type GroupPendingKey = 'prefix' | 'middleware' | 'namePrefix' | 'controller' | 'domain' | 'constraints';
    type PresentGroupPendingKey = { readonly kind: 'present'; readonly value: GroupPendingKey };
    const propertyReader = routeGroupProperty(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value)));
    const bindingReader = routeGroupBindingScope(presenceFold(cursor.currentPresence, () => absent<string>(), token => present(token.value)));
    const candidates: readonly Presence<GroupPendingKey>[] = [propertyReader, bindingReader, present('constraints')];
    const selected = relationOptionFold(
        relationFirst(candidates, (value): value is PresentGroupPendingKey => isPresent(value)),
        () => absent<GroupPendingKey>(),
        value => present(value.value),
    );
    return presenceFold(selected, () => emptyGroupDelta(), key => catalogRequired(GROUP_PENDING_FACTS, present(key))(cursor));
};
export const routeGroupPendingState = (cursor: TokenCursor, pending: RouteGroupStateModel): RouteGroupStateModel => {
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
    readonly action: string;
    readonly returns: readonly [
    ];
} | {
    readonly kind: 'controller_invokable';
    readonly controller: string;
} | {
    readonly kind: 'controller_action';
    readonly controller: string;
    readonly action: string;
} | {
    readonly kind: 'unsupported';
    readonly reason: string;
};
const targetCandidate = (value: RouteTargetDescription): readonly RouteTargetDescription[] => Object.freeze([value]);
const noTargetCandidates = (): readonly RouteTargetDescription[] => Object.freeze([]);
const targetDescriptionCandidates = (route: TokenCursor): readonly RouteTargetDescription[] => {
    const argument = route.secondCallArgumentPresence;
    const invokable = presenceFold(argument, noTargetCandidates, value => presenceFold(value.currentPresence, noTargetCandidates, (target: TokenDescriptor) =>
        relationResolve(relationAll([tokenHasKind(target, SYNTAX_KIND_GROUPS.identifiers), value.classReference]),
            () => targetCandidate({ kind: 'controller_invokable', controller: target.value }),
            noTargetCandidates)));
    const arrayAction = presenceFold(argument, noTargetCandidates, value =>
        presenceFold(presenceOf(value.firstDelimitedElementCursor), noTargetCandidates, (controllerCursor: TokenCursor) =>
            presenceFold(presenceOf(value.secondDelimitedElementCursor), noTargetCandidates, (actionCursor: TokenCursor) =>
                presenceFold(controllerCursor.currentPresence, noTargetCandidates, (controller: TokenDescriptor) =>
                    presenceFold(actionCursor.currentPresence, noTargetCandidates, (action: TokenDescriptor) =>
                        relationResolve(relationAll([tokenHasKind(controller, SYNTAX_KIND_GROUPS.identifiers), value.classReference, tokenHasKind(action, SYNTAX_KIND_GROUPS.strings)]),
                            () => targetCandidate({ kind: 'controller_action', controller: controller.value, action: action.value }),
                            noTargetCandidates))))));
    return Object.freeze([...invokable, ...arrayAction]);
};
const targetDescriptionFallback = (method: LaravelRouteMethod): RouteTargetDescription => Object.freeze({ kind: 'unsupported', reason: `unsupported route target syntax: ${method}` });
export const routeTargetDescription = (route: TokenCursor, method: LaravelRouteMethod): RouteTargetDescription => relationFirstOr(targetDescriptionCandidates(route), candidate => relationAny([
    relationEqual(candidate.kind, 'controller_invokable'),
    relationEqual(candidate.kind, 'controller_action'),
]), targetDescriptionFallback(method));
export const routeTargetAst = (route: TokenCursor, method: LaravelRouteMethod): RouteTargetAst => {
    const description = routeTargetDescription(route, method);
    return relationVariantFold<RouteTargetDescription, 'closure', RouteTargetAst>(description, 'closure',
        rest => relationVariantFold<Exclude<RouteTargetDescription, { readonly kind: 'closure' }>, 'controller_invokable', RouteTargetAst>(rest, 'controller_invokable',
            remaining => relationVariantFold<Exclude<RouteTargetDescription, { readonly kind: 'closure' | 'controller_invokable' }>, 'controller_action', RouteTargetAst>(remaining, 'controller_action',
                unsupported => relationVariantFold<Extract<RouteTargetDescription, { readonly kind: 'unsupported' }>, 'unsupported', RouteTargetAst>(unsupported, 'unsupported',
                    () => ({ kind: 'unsupported', reason: 'unsupported route target' }),
                    value => ({ kind: 'unsupported', reason: value.reason })),
                value => ({ kind: 'controller_action', controller: { kind: 'identifier', value: value.controller }, action: { kind: 'identifier', value: value.action } })),
            value => ({ kind: 'controller_invokable', controller: { kind: 'identifier', value: value.controller } })),
        value => ({ kind: 'closure', action: { kind: 'identifier', value: value.action }, returns: [] }));
};
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
export const mergeRouteGroupStates = (groups: readonly RouteGroupStateModel[]): MergedRouteGroupStateModel => {
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
    route_root: presenceFold(cursor.currentPresence, () => false, (token: TokenDescriptor) => tokenHasKind(token, SYNTAX_KIND_GROUPS.routeRoots)),
    separator: presenceFold(cursor.nextPresence, () => false, (token: TokenDescriptor) => tokenHasKind(token, SYNTAX_KIND_GROUPS.separators)),
});
export const routeInvocationFact = (cursor: TokenCursor): RouteInvocationFact => Object.freeze({
    kind: 'route_invocation',
    requirements: routeInvocationRequirements(cursor),
    method: presenceFold(cursor.afterNextPresence, () => absent<LaravelRouteMethod>(), (token: TokenDescriptor) => relationOptionFold(tokenRouteMethod(token), () => absent<LaravelRouteMethod>(), value => present(value))),
});
export const routeInvocationMethod = (cursor: TokenCursor): Presence<LaravelRouteMethod> => {
    const fact = routeInvocationFact(cursor);
    const valid = relationAll([fact.requirements.route_root, fact.requirements.separator]);
    return relationResolve(valid, () => fact.method, () => absent<LaravelRouteMethod>());
};

export type RouteSyntaxSemanticFact =
    | { readonly kind: 'route_path'; readonly value: RoutePathTokenFact }
    | { readonly kind: 'route_constraint'; readonly value: RouteConstraintSyntaxFact }
    | { readonly kind: 'route_target'; readonly value: RouteTargetDescription }
    | { readonly kind: 'route_invocation'; readonly value: RouteInvocationFact };

export interface RouteSyntaxSemanticJudgment {
    readonly kind: 'route_syntax_semantic_judgment';
    readonly source: 'laravel_route_syntax';
    readonly method: LaravelRouteMethod;
    readonly facts: readonly RouteSyntaxSemanticFact[];
    readonly reasoning: 'declarative_relation_catalog';
    readonly closed: true;
}

const routePathSemanticFact = (value: RoutePathTokenFact): RouteSyntaxSemanticFact => ({ kind: 'route_path', value });
const routeConstraintSemanticFact = (value: RouteConstraintSyntaxFact): RouteSyntaxSemanticFact => ({ kind: 'route_constraint', value });
const routeTargetSemanticFact = (value: RouteTargetDescription): RouteSyntaxSemanticFact => ({ kind: 'route_target', value });
const routeInvocationSemanticFact = (value: RouteInvocationFact): RouteSyntaxSemanticFact => ({ kind: 'route_invocation', value });

export const routeSyntaxSemanticJudgment = (cursor: TokenCursor, method: LaravelRouteMethod): RouteSyntaxSemanticJudgment => Object.freeze({
    kind: 'route_syntax_semantic_judgment',
    source: 'laravel_route_syntax',
    method,
    facts: Object.freeze([
        routePathSemanticFact(routePathTokenFact(cursor, method)),
        ...presenceFold(routeConstraintFact(cursor), () => Object.freeze([]), value => Object.freeze([routeConstraintSemanticFact(value)])),
        routeTargetSemanticFact(routeTargetDescription(cursor, method)),
        routeInvocationSemanticFact(routeInvocationFact(cursor)),
    ]),
    reasoning: 'declarative_relation_catalog',
    closed: true,
});

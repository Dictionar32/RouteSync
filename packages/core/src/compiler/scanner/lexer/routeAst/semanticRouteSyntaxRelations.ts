import { relationAll, relationAny, relationNormalizeWhitespace } from '../../../../semantic/kernel/semanticRelations';
import { relationContains, relationUnique } from '../../../../semantic/kernel/relationMembership';
import { relationResolve } from '../../../relational/sequence';
import { relationFirst, relationOptionMap, relationOptionValue } from '../../../../semantic/kernel/relationalSequence';
import { projectRelation, selectRelation, expandRelation, accumulateRelation } from '../../../relational/sequence';
import { routeConstraintPatternAst, routeConstraintValuesAst, routeConstraintNoneAst, type LaravelRouteMethod, type RouteConstraintMethodAst, type RouteTargetAst, type RouteConstraintArgumentAst, } from './routeDeclarationAst';
import type { RouteResourceMethodAst } from './routeResourceDeclarationAst';
import { TokenCursor } from '../../../../semantic/kernel/syntax/relationalSyntaxCursor';
import { absent, present, mapOptional, presenceFold, fromOptional, isPresent, type Presence } from '../../../../types/upstream/presence';
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
const catalogLookup = <T>(catalog: Catalog<T>, value: string | void): Presence<T> => relationOptionFold(relationOptionMap(relationFirst(catalog, ([key]) => Object.is(key, value)), ([, entry]) => entry), () => absent<T>(), entry => present(entry));
const catalogValue = <T>(catalog: Catalog<T>, value: string | void): Presence<T> => catalogLookup(catalog, value);
const catalogRequired = <T>(catalog: Catalog<T>, value: string): T => {
    const result = catalogLookup(catalog, value);
    return Object.freeze({
        present: (entry: Presence<T>): T => entry.value,
        absent: (_entry: Presence<T>): T => { throw Error(`Unknown syntax catalog value: ${value}`); },
    })[result.kind](result);
};
export const routeMethod = (value: string | void): Presence<LaravelRouteMethod> => catalogValue(ROUTE_METHODS, value);
export const routeConstraintMethod = (value: string | void): Presence<RouteConstraintMethodAst> => catalogValue(ROUTE_CONSTRAINT_METHODS, value);
export const resourceMethod = (value: string | void): Presence<RouteResourceMethodAst> => catalogValue(RESOURCE_METHODS, value);
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
    string: (fact: RoutePathTokenFact) => relationContains(SYNTAX_KIND_GROUPS.strings, fact.actual?.kind),
    any: () => true,
});
export const routePathTokenFact = (cursor: TokenCursor, method: LaravelRouteMethod): RoutePathTokenFact => {
    const policy = catalogRequired(ROUTE_PATH_TOKEN_POLICIES, method);
    return Object.freeze({ kind: 'route_path_token', method, expectation: policy.expectation, actual: tokenSyntaxFact(cursor.current) });
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
const firstArgumentSpans = (cursor: TokenCursor): readonly { readonly start: TokenCursor; readonly end: TokenCursor }[] => presenceFold(fromOptional(cursor.firstCallArgumentSpan), () => Object.freeze([]), value => Object.freeze([value]));
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
    const policy = catalogRequired(RESOURCE_MIDDLEWARE_ARGUMENT_POLICIES, method);
    return Object.freeze({
        middleware: collectSpanStrings(policy.middlewareSpans(cursor)),
        actions: collectSpanStrings(policy.actionSpans(cursor)),
    });
};
export interface RouteTargetMethodSet {
    readonly methods: readonly LaravelRouteMethod[];
}
interface RouteTargetMethodResolver {
    readonly(start: TokenCursor, method: LaravelRouteMethod): readonly LaravelRouteMethod[];
}
const routeTargetDefault: RouteTargetMethodResolver = (_, method) => Object.freeze([method]);
const routeTargetMatch: RouteTargetMethodResolver = (start, method) => {
    const methods = projectRelation(selectRelation(projectRelation(start.callArgumentCursor.delimitedElementSpans, span => fromOptional(tokenRouteMethod(span.start.current))), isPresent), value => value.value);
    return Object.freeze(relationUnique(methods));
};
const ROUTE_TARGET_METHOD_RESOLVERS: Catalog<RouteTargetMethodResolver> = Object.freeze([
    ['get', routeTargetDefault], ['post', routeTargetDefault], ['put', routeTargetDefault], ['patch', routeTargetDefault],
    ['delete', routeTargetDefault], ['options', routeTargetDefault], ['head', routeTargetDefault], ['match', routeTargetMatch],
    ['any', routeTargetDefault], ['apiResource', routeTargetDefault],
]);
/** Resolves route target methods through a syntax strategy rather than parser branching. */
export const routeTargetMethodSet = (start: TokenCursor, method: LaravelRouteMethod): RouteTargetMethodSet => Object.freeze({ methods: catalogRequired(ROUTE_TARGET_METHOD_RESOLVERS, method)(start, method) });
export type RouteResourceMiddlewareScopeKind = 'all' | 'only' | 'except';
const RESOURCE_MIDDLEWARE_SCOPE: Catalog<RouteResourceMiddlewareScopeKind> = Object.freeze([
    ['middleware', 'all'], ['middlewareFor', 'only'], ['withoutMiddlewareFor', 'except'],
]);
export const resourceMiddlewareScope = (method: ResourceMiddlewareMethod): RouteResourceMiddlewareScopeKind => catalogRequired(RESOURCE_MIDDLEWARE_SCOPE, method);
export type RouteConstraintSyntaxArgument = {
    readonly kind: 'pattern';
    readonly value: string;
} | {
    readonly kind: 'values';
    readonly values: readonly string[];
} | {
    readonly kind: 'none';
};
export interface RouteConstraintSyntaxFact {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: string;
    readonly argument: RouteConstraintSyntaxArgument;
}
const stringValue = (cursor: TokenCursor | void): string | void => [cursor?.current].find((token): token is NonNullable<typeof token> => tokenHasKind(token, SYNTAX_KIND_GROUPS.strings))?.value;
const arrayArgumentValues = (cursor: TokenCursor | void): readonly string[] => Object.freeze(selectRelation(projectRelation(cursor?.delimitedElementSpans, span => relationNormalizeWhitespace(projectRelation(span.start.tokensUntil(span.end), token => token.value).join(''))), value => value.length > 0));
interface ConstraintStrategy {
    readonly(parameter: string, second: TokenCursor | void, method: RouteConstraintMethodAst): Presence<RouteConstraintSyntaxFact>;
}
const plainConstraint: ConstraintStrategy = (parameter, _second, method) => present(Object.freeze({ method, parameter, argument: Object.freeze({ kind: 'none' }) }));
const stringConstraint: ConstraintStrategy = (parameter, second, method) => mapOptional(stringValue(second), value => Object.freeze({
    method, parameter, argument: Object.freeze({ kind: 'pattern', value }),
}));
const arrayConstraint: ConstraintStrategy = (parameter, second, method) => projectRelation(selectRelation([arrayArgumentValues(second)], values => values.length > 0), values => present(Object.freeze({ method, parameter, argument: Object.freeze({ kind: 'values', values }) }))).concat([absent<RouteConstraintSyntaxFact>()])
    .find(() => true)!;
const ROUTE_CONSTRAINT_STRATEGIES: Catalog<ConstraintStrategy> = Object.freeze([
    ['where', stringConstraint], ['whereNumber', plainConstraint], ['whereAlpha', plainConstraint],
    ['whereAlphaNumeric', plainConstraint], ['whereUuid', plainConstraint], ['whereUlid', plainConstraint], ['whereIn', arrayConstraint],
]);
/** Converts a Laravel constraint call into a typed syntax fact; meaning is selected by a declarative strategy catalog. */
export const routeConstraintFact = (cursor: TokenCursor): Presence<RouteConstraintSyntaxFact> => {
    const method = fromOptional(tokenRouteConstraintMethod(cursor.current));
    const parameter = fromOptional(stringValue(cursor.callArgumentCursor));
    const second = projectRelation(selectRelation([cursor.secondCallArgumentPresence], isPresent), presence => presence.value).find(() => true);
    const methodValue = presenceFold(method, () => '', entry => entry);
    const strategy = catalogLookup(ROUTE_CONSTRAINT_STRATEGIES, methodValue);
    return ({
        absent: () => absent<RouteConstraintSyntaxFact>(),
        present: (methodEntry: typeof method & {
            readonly kind: 'present';
        }) => ({
            absent: () => absent<RouteConstraintSyntaxFact>(),
            present: (parameterEntry: typeof parameter & {
                readonly kind: 'present';
            }) => ({
                absent: () => absent<RouteConstraintSyntaxFact>(),
                present: (strategyEntry: typeof strategy & {
                    readonly kind: 'present';
                }) => strategyEntry.value(parameterEntry.value, second, methodEntry.value),
            })[strategy.kind](strategy),
        })[parameter.kind](parameter),
    })[method.kind](method);
};
type RouteConstraintArgumentBuilder = {
    readonly pattern: (argument: Extract<RouteConstraintSyntaxArgument, {
        readonly kind: 'pattern';
    }>) => RouteConstraintArgumentAst;
    readonly values: (argument: Extract<RouteConstraintSyntaxArgument, {
        readonly kind: 'values';
    }>) => RouteConstraintArgumentAst;
    readonly none: (argument: Extract<RouteConstraintSyntaxArgument, {
        readonly kind: 'none';
    }>) => RouteConstraintArgumentAst;
};
const ROUTE_CONSTRAINT_ARGUMENT_BUILDERS: RouteConstraintArgumentBuilder = Object.freeze({
    pattern: argument => routeConstraintPatternAst(argument.value),
    values: argument => routeConstraintValuesAst(argument.values),
    none: () => routeConstraintNoneAst(),
});
const routeConstraintArgumentAstByKind = <K extends RouteConstraintSyntaxArgument['kind']>(argument: Extract<RouteConstraintSyntaxArgument, {
    readonly kind: K;
}>): RouteConstraintArgumentAst => ROUTE_CONSTRAINT_ARGUMENT_BUILDERS[argument.kind](argument);
export const routeConstraintArgumentAst = (argument: RouteConstraintSyntaxArgument): RouteConstraintArgumentAst => routeConstraintArgumentAstByKind(argument);
export const isGroupWhere = (cursor: TokenCursor): boolean => {
    const range = cursor.rangeTo(cursor.statementEndCursor);
    const marker = range.start.nextCursor.find((token, at) => relationAny([
        tokenHasKind(token, SYNTAX_KIND_GROUPS.groups),
        relationAll([tokenHasKind(token, SYNTAX_KIND_GROUPS.routeRoots), tokenHasKind(at.next, SYNTAX_KIND_GROUPS.separators)]),
        tokenHasKind(token, SYNTAX_KIND_GROUPS.arrayClosers),
        tokenHasKind(token, SYNTAX_KIND_GROUPS.statementEnds),
      ]));
    return tokenHasKind(marker?.current, SYNTAX_KIND_GROUPS.groups);
};
export type RouteGroupBindingScope = 'default' | 'scoped' | 'without_scoped';
export interface RouteGroupConstraintFact {
    readonly method: RouteConstraintMethodAst;
    readonly parameter: string;
    readonly argument: RouteConstraintSyntaxArgument;
}
export interface RouteGroupStateModel {
    readonly prefix?: string;
    readonly middleware: readonly string[];
    readonly namePrefix?: string;
    readonly controller?: string;
    readonly domain?: string;
    readonly bindingScope: RouteGroupBindingScope;
    readonly constraints: readonly RouteGroupConstraintFact[];
}
export const emptyRouteGroupState = (): RouteGroupStateModel => ({
    middleware: Object.freeze([]),
    bindingScope: 'default',
    constraints: Object.freeze([]),
});
const GROUP_BINDING_SCOPE: Catalog<RouteGroupBindingScope> = Object.freeze([
    ['scopeBindings', 'scoped'], ['withoutScopedBindings', 'without_scoped'],
]);
const GROUP_PROPERTIES: Catalog<keyof RouteGroupStateModel> = Object.freeze([
    ['prefix', 'prefix'], ['middleware', 'middleware'], ['name', 'namePrefix'], ['controller', 'controller'], ['domain', 'domain'],
]);
export const routeGroupBindingScope = (method: string | void): RouteGroupBindingScope | void => catalogValue(GROUP_BINDING_SCOPE, method);
export const routeGroupProperty = (method: string | void): keyof RouteGroupStateModel | void => catalogValue(GROUP_PROPERTIES, method);
const groupConstraintFact = (fact: RouteConstraintSyntaxFact): RouteGroupConstraintFact => Object.freeze({
    method: fact.method, parameter: fact.parameter, argument: fact.argument,
});
export const routeGroupConstraint = (cursor: TokenCursor): Presence<RouteGroupConstraintFact> => {
    const fact = routeConstraintFact(cursor);
    return projectRelation(selectRelation([fact], (entry): entry is {
        readonly kind: 'present';
        readonly value: RouteConstraintSyntaxFact;
    } => isPresent(entry)), entry => present(groupConstraintFact(entry.value))).concat([absent<RouteGroupConstraintFact>()])
        .find(() => true)!;
};
export interface RouteGroupTransitionModel {
    readonly groups: readonly RouteGroupStateModel[];
    readonly pending: RouteGroupStateModel;
}
const ROUTE_GROUP_OPERATIONS: Catalog<'push' | 'pop'> = Object.freeze([['group', 'push'], ['}', 'pop']]);
const pushRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => Object.freeze({ groups: Object.freeze([...groups, pending]), pending: emptyRouteGroupState() });
const popRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => {
    const reversed = [...groups].reverse();
    reversed.shift();
    const nextGroups = reversed.reverse();
    return Object.freeze({ groups: Object.freeze(nextGroups), pending });
};
const retainRouteGroup = (groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => Object.freeze({ groups, pending });
const ROUTE_GROUP_TRANSITIONS: Catalog<(groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel) => RouteGroupTransitionModel> = Object.freeze([
    ['push', pushRouteGroup], ['pop', popRouteGroup], ['retain', retainRouteGroup],
]);
export const advanceRouteGroupState = (value: string, groups: readonly RouteGroupStateModel[], pending: RouteGroupStateModel): RouteGroupTransitionModel => projectRelation(selectRelation([fromOptional(catalogValue(ROUTE_GROUP_OPERATIONS, value))], isPresent), operation => catalogValue(ROUTE_GROUP_TRANSITIONS, operation.value)!(groups, pending)).concat(retainRouteGroup(groups, pending))
    .find(() => true)!;
const groupStringValues = (cursor: TokenCursor): readonly string[] => Object.freeze(expandRelation(allArgumentSpans(cursor), span => projectRelation(selectRelation(span.start.tokensUntil(span.end), token => tokenHasKind(token, SYNTAX_KIND_GROUPS.strings)), token => token.value)));
const GROUP_PENDING_FACTS: Catalog<(cursor: TokenCursor) => Partial<RouteGroupStateModel>> = Object.freeze([
    ['prefix', cursor => ({ prefix: groupStringValues(cursor).find(() => true) })],
    ['middleware', cursor => ({ middleware: groupStringValues(cursor) })],
    ['namePrefix', cursor => ({ namePrefix: groupStringValues(cursor).find(() => true) })],
    ['controller', cursor => ({ controller: groupStringValues(cursor).find(() => true) })],
    ['domain', cursor => ({ domain: groupStringValues(cursor).find(() => true) })],
    ['bindingScope', cursor => ({ bindingScope: routeGroupBindingScope(cursor.current?.value) })],
    ['constraints', cursor => ({
            constraints: Object.freeze(projectRelation(selectRelation([routeGroupConstraint(cursor)], (value): value is {
                readonly kind: 'present';
                readonly value: RouteGroupConstraintFact;
            } => isPresent(value)), value => value.value)),
        })],
]);
const GROUP_PENDING_FACT_READERS = Object.freeze({
    property: (cursor: TokenCursor): Partial<RouteGroupStateModel> => Object.assign(Object.freeze({}), catalogValue(GROUP_PENDING_FACTS, routeGroupProperty(cursor.current?.value))?.(cursor)),
    bindingScope: (cursor: TokenCursor): Partial<RouteGroupStateModel> => Object.assign(Object.freeze({}), catalogValue(GROUP_PENDING_FACTS, 'bindingScope')?.(cursor)),
    constraint: (cursor: TokenCursor): Partial<RouteGroupStateModel> => Object.assign(Object.freeze({}), catalogValue(GROUP_PENDING_FACTS, 'constraints')?.(cursor)),
});
const groupPendingFact = (cursor: TokenCursor): Partial<RouteGroupStateModel> => {
    const propertyReader = catalogValue(GROUP_PENDING_FACTS, routeGroupProperty(cursor.current?.value));
    const bindingReader = projectRelation(selectRelation([fromOptional(routeGroupBindingScope(cursor.current?.value))], isPresent), () => catalogValue(GROUP_PENDING_FACTS, 'bindingScope')).find(() => true);
    const constraintReader = catalogValue(GROUP_PENDING_FACTS, 'constraints');
    const strategy = projectRelation(selectRelation([propertyReader, bindingReader, constraintReader], isPresent), reader => reader.value).find(() => true);
    return Object.assign(Object.freeze({}), strategy?.(cursor));
};
const definedGroupFactEntries = (fact: Partial<RouteGroupStateModel>): readonly [
    string,
    unknown
][] => expandRelation(Object.entries(fact), ([key, value]) => ({
    present: (entry: {
        readonly kind: 'present';
        readonly value: unknown;
    }) => [[key, entry.value]],
    absent: () => [],
})[fromOptional(value).kind](fromOptional(value)));
export const routeGroupPendingState = (cursor: TokenCursor, pending: RouteGroupStateModel): RouteGroupStateModel => {
    const fact = groupPendingFact(cursor);
    const addedConstraints = Object.freeze(({
        present: (entry: {
            readonly kind: 'present';
            readonly value: RouteGroupStateModel['constraints'];
        }) => entry.value,
        absent: () => [],
    })[fromOptional(fact.constraints).kind](fromOptional(fact.constraints)));
    const definedFact = Object.fromEntries(definedGroupFactEntries(fact));
    return Object.freeze({
        ...pending,
        ...definedFact,
        constraints: Object.freeze([...pending.constraints, ...addedConstraints]),
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
const targetDescriptionCandidates = (route: TokenCursor, method: LaravelRouteMethod): readonly RouteTargetDescription[] => {
    const argument = projectRelation(selectRelation([route.secondCallArgumentPresence], (presence): presence is {
        readonly kind: 'present';
        readonly value: TokenCursor;
    } => isPresent(presence)), presence => presence.value).find(() => true);
    const target = argument?.current;
    const invokable = projectRelation(selectRelation([{ target, argument }], value => relationAll([tokenHasKind(value.target, SYNTAX_KIND_GROUPS.identifiers), Boolean(value.argument?.classReference)])), value => Object.freeze({ kind: 'controller_invokable', controller: value.target.value }));
    const controller = argument?.firstDelimitedElementCursor?.current;
    const action = argument?.secondDelimitedElementCursor?.current;
    const arrayAction = projectRelation(selectRelation([{ controller, argument, action }], value => relationAll([tokenHasKind(value.controller, SYNTAX_KIND_GROUPS.identifiers), Boolean(value.argument?.firstDelimitedElementCursor?.classReference), tokenHasKind(value.action, SYNTAX_KIND_GROUPS.strings)])), value => Object.freeze({ kind: 'controller_action', controller: value.controller.value, action: value.action.value }));
    return Object.freeze([...invokable, ...arrayAction]);
};
const targetDescriptionFallback = (method: LaravelRouteMethod): RouteTargetDescription => Object.freeze({ kind: 'unsupported', reason: `unsupported route target syntax: ${method}` });
export const routeTargetDescription = (route: TokenCursor, method: LaravelRouteMethod): RouteTargetDescription => accumulateRelation(targetDescriptionCandidates(route, method), (first, _value) => first, targetDescriptionFallback(method));
const ROUTE_TARGET_AST_BUILDERS: Catalog<(description: RouteTargetDescription) => RouteTargetAst> = Object.freeze([
    ['closure', description => ({ kind: 'closure', action: { kind: 'identifier', value: description.action }, returns: [] })],
    ['controller_invokable', description => ({ kind: 'controller_invokable', controller: { kind: 'identifier', value: description.controller } })],
    ['controller_action', description => ({ kind: 'controller_action', controller: { kind: 'identifier', value: description.controller }, action: { kind: 'identifier', value: description.action } })],
    ['unsupported', description => ({ kind: 'unsupported', reason: description.reason })],
]);
export const routeTargetAst = (route: TokenCursor, method: LaravelRouteMethod): RouteTargetAst => {
    const description = routeTargetDescription(route, method);
    return catalogValue(ROUTE_TARGET_AST_BUILDERS, description.kind)!(description);
};
export interface MergedRouteGroupStateModel {
    readonly prefixes: readonly string[];
    readonly middleware: readonly string[];
    readonly namePrefixes: readonly string[];
    readonly controller?: string;
    readonly domain?: string;
    readonly bindingScope: RouteGroupBindingScope;
    readonly constraints: readonly RouteGroupConstraintFact[];
}
const optionalValues = <T>(values: readonly (T | void)[]): readonly T[] => Object.freeze(expandRelation(values, value => ({
    present: (entry: {
        readonly kind: 'present';
        readonly value: T;
    }) => [entry.value],
    absent: () => [],
})[fromOptional(value).kind](fromOptional(value))));
const DEFAULT_BINDING_SCOPES = Object.freeze(['default'] as const);
const lastOr = <T>(values: readonly T[], fallback: T): T => accumulateRelation(values, (last, value) => value, fallback);
const lastPresence = <T>(values: readonly T[]): Presence<T> => relationResolve(values.length > 0, () => present(values[values.length - 1]), absent);
export const mergeRouteGroupStates = (groups: readonly RouteGroupStateModel[]): MergedRouteGroupStateModel => {
    const controllers = optionalValues(projectRelation(groups, group => group.controller));
    const domains = optionalValues(projectRelation(groups, group => group.domain));
    const scopes = selectRelation(projectRelation(groups, group => group.bindingScope), value => !relationContains(DEFAULT_BINDING_SCOPES, value));
    return Object.freeze({
        prefixes: Object.freeze(expandRelation(groups, group => optionalValues([group.prefix]))),
        middleware: Object.freeze(expandRelation(groups, group => group.middleware)),
        namePrefixes: Object.freeze(expandRelation(groups, group => optionalValues([group.namePrefix]))),
        ...presenceFold(lastPresence(controllers), () => Object.freeze({}), value => Object.freeze({ controller: value })),
        ...presenceFold(lastPresence(domains), () => Object.freeze({}), value => Object.freeze({ domain: value })),
        bindingScope: lastOr(scopes, 'default'),
        constraints: Object.freeze(expandRelation(groups, group => group.constraints)),
    });
};
export type RouteInvocationRequirement = 'route_root' | 'separator';
export interface RouteInvocationFact {
    readonly kind: 'route_invocation';
    readonly requirements: Readonly<Record<RouteInvocationRequirement, boolean>>;
    readonly method: LaravelRouteMethod | void;
}
const ROUTE_INVOCATION_REQUIREMENTS: Readonly<Record<RouteInvocationRequirement, (cursor: TokenCursor) => boolean>> = Object.freeze({
    route_root: cursor => tokenHasKind(cursor.current, SYNTAX_KIND_GROUPS.routeRoots),
    separator: cursor => tokenHasKind(cursor.next, SYNTAX_KIND_GROUPS.separators),
});
export const routeInvocationFact = (cursor: TokenCursor): RouteInvocationFact => Object.freeze({
    kind: 'route_invocation',
    requirements: Object.freeze(Object.fromEntries(projectRelation(Object.entries(ROUTE_INVOCATION_REQUIREMENTS), ([key, read]) => [key, read(cursor)]))),
    method: tokenRouteMethod(cursor.afterNext),
});
export const routeInvocationMethod = (cursor: TokenCursor): LaravelRouteMethod | void => {
    const fact = routeInvocationFact(cursor);
    const valid = Object.values(fact.requirements).every(Boolean);
    return relationResolve(valid, () => fromOptional(fact.method), absent);
};

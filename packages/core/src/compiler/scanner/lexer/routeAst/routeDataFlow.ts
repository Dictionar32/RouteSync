import { relationNotEqual, relationAny, relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationResolve, relationFirstOption, relationOptionFold, projectRelation, selectRelation, expandRelation, accumulateRelation, visitRelation } from '../../../relational/sequence';
import type { Presence } from '../../../../types/upstream/presence';
import { fromOptional, cardinalityOf, type Cardinality } from '../../../../types/upstream/presence';
import type { RouteDeclarationAst, RouteTargetAst, LaravelRouteMethod, RouteConstraintArgumentAst } from './routeDeclarationAst';
import type { RouteResourceDeclarationAst } from './routeResourceDeclarationAst';
/**
 * Route data-flow model.
 *
 * Syntax producers emit facts once; downstream consumers receive typed facts
 * with provenance and explicit presence. No Laravel meaning is selected by
 * parser control flow here.
 */
export type RouteDataFlowStage = 'source' | 'syntax_fact' | 'semantic_fact' | 'consumer';
export type RouteDataFlowFactKind = 'route' | 'target' | 'binding' | 'group' | 'constraint' | 'middleware' | 'resource' | 'resource_middleware';
export interface RouteDataFlowProvenance {
    readonly source: RouteDataFlowStage;
    readonly producer: string;
    readonly model: string;
    readonly consumer: string;
}
export type RouteDataFlowNodeKind = 'source' | 'syntax_fact' | 'semantic_fact' | 'consumer';
export interface RouteDataFlowNode<T = unknown> {
    readonly id: string;
    readonly kind: RouteDataFlowNodeKind;
    readonly value: T;
    readonly provenance: RouteDataFlowProvenance;
}
export interface RouteDataFlowEdge {
    readonly from: string;
    readonly to: string;
    readonly kind: RouteDataFlowFactKind;
    readonly cardinality: Cardinality;
}
export interface RouteDataFlowGraph {
    readonly nodes: readonly RouteDataFlowNode[];
    readonly edges: readonly RouteDataFlowEdge[];
}
export interface RouteDataFlowFact<T> {
    readonly kind: RouteDataFlowFactKind;
    readonly value: T;
    readonly cardinality: Cardinality;
    readonly provenance: RouteDataFlowProvenance;
}
export type RouteDeclarationSemanticKind = 'api_resource' | 'standard';
const ROUTE_DECLARATION_SEMANTIC_KIND: Readonly<Record<LaravelRouteMethod, RouteDeclarationSemanticKind>> = Object.freeze({
    apiResource: 'api_resource',
    get: 'standard',
    post: 'standard',
    put: 'standard',
    patch: 'standard',
    delete: 'standard',
    options: 'standard',
    head: 'standard',
    match: 'standard',
    any: 'standard',
});
export const routeDeclarationSemanticKind = (method: LaravelRouteMethod): RouteDeclarationSemanticKind => ROUTE_DECLARATION_SEMANTIC_KIND[method];
export type RouteMethodSemanticKind = 'any' | 'match' | 'standard';
const ROUTE_METHOD_SEMANTIC_KIND: Readonly<Record<LaravelRouteMethod, RouteMethodSemanticKind>> = Object.freeze({
    apiResource: 'standard',
    get: 'standard',
    post: 'standard',
    put: 'standard',
    patch: 'standard',
    delete: 'standard',
    options: 'standard',
    head: 'standard',
    match: 'match',
    any: 'any',
});
export const routeMethodSemanticKind = (method: LaravelRouteMethod): RouteMethodSemanticKind => ROUTE_METHOD_SEMANTIC_KIND[method];
export type RouteSourceFileContext = {
    readonly kind: 'api_routes';
} | {
    readonly kind: 'web_routes';
} | {
    readonly kind: 'custom_routes';
    readonly file: string;
};
const ROUTE_SOURCE_FILE_CONTEXT_KNOWLEDGE: Readonly<Record<'api_routes' | 'web_routes', readonly string[]>> = Object.freeze({
    api_routes: Object.freeze(['routes/api.php']),
    web_routes: Object.freeze(['routes/web.php']),
});
const normalizeRouteSourcePath = (sourcePath: string): string => sourcePath.split('\\').join('/');
const ROUTE_SOURCE_FILE_CONTEXT_READERS = Object.freeze([
    (normalized: string): Presence<RouteSourceFileContext> => relationResolve(
        relationAny([relationEqual(normalized, ROUTE_SOURCE_FILE_CONTEXT_KNOWLEDGE.api_routes[0]), normalized.endsWith('/routes/api.php')]),
        () => fromOptional({ kind: 'api_routes' as const }),
        () => fromOptional<RouteSourceFileContext>(),
    ),
    (normalized: string): Presence<RouteSourceFileContext> => relationResolve(
        relationAny([relationEqual(normalized, ROUTE_SOURCE_FILE_CONTEXT_KNOWLEDGE.web_routes[0]), normalized.endsWith('/routes/web.php')]),
        () => fromOptional({ kind: 'web_routes' as const }),
        () => fromOptional<RouteSourceFileContext>(),
    ),
]);
export const routeSourceFileContextKnowledge = (sourcePath: string): RouteSourceFileContext => {
    const normalized = normalizeRouteSourcePath(sourcePath);
    const resolved = relationFirstOption(ROUTE_SOURCE_FILE_CONTEXT_READERS, reader => relationResolve(relationEqual(reader(normalized).kind, 'present'), () => true, () => false));
    return relationOptionFold(resolved, () => ({ kind: 'custom_routes', file: normalized }), reader => reader(normalized).value);
};
export interface RouteDeclarationFlow {
    readonly method: LaravelRouteMethod;
    readonly target: RouteDataFlowFact<RouteTargetAst>;
    readonly bindings: RouteDataFlowFact<RouteDeclarationAst['bindings']>;
    readonly group: RouteDataFlowFact<RouteGroupData>;
    readonly constraints: RouteDataFlowFact<readonly RouteConstraintData[]>;
    readonly middleware: RouteDataFlowFact<readonly string[]>;
}
export interface RouteGroupData {
    readonly prefix: readonly string[];
    readonly namePrefix: readonly string[];
    readonly controller: Presence<string>;
    readonly domain: Presence<string>;
    readonly bindingScope: string;
    readonly constraints: readonly RouteConstraintData[];
}
export interface RouteConstraintData {
    readonly method: string;
    readonly parameter: string;
    readonly argument: RouteConstraintArgumentAst;
    readonly source: 'route' | 'group';
}
export interface RouteResourceFlow {
    readonly method: RouteResourceDeclarationAst['method'];
    readonly resource: string;
    readonly controller: string;
    readonly middleware: RouteDataFlowFact<RouteResourceDeclarationAst['middleware']>;
    readonly exclusions: RouteDataFlowFact<RouteResourceDeclarationAst['middlewareExclusions']>;
}
const provenance = (producer: string, model: string, consumer: string): RouteDataFlowProvenance => Object.freeze({
    source: 'syntax_fact',
    producer,
    model,
    consumer,
});
const fact = <T>(kind: RouteDataFlowFactKind, value: T, producer: string, model: string, consumer: string, cardinality: Cardinality): RouteDataFlowFact<T> => Object.freeze({
    kind,
    value,
    cardinality,
    provenance: provenance(producer, model, consumer),
});
const constraintData = (source: RouteConstraintData['source'], constraint: RouteDeclarationAst['routeConstraints'][number]): RouteConstraintData => Object.freeze({
    method: constraint.method,
    parameter: constraint.parameter,
    argument: constraint.argument,
    source,
});
const routeConstraints = (route: RouteDeclarationAst): readonly RouteConstraintData[] => Object.freeze([
    ...projectRelation(route.routeConstraints, item => constraintData('route', item)),
    ...projectRelation(route.groupConstraints, item => constraintData('group', item)),
]);
const routeGroup = (route: RouteDeclarationAst): RouteGroupData => Object.freeze({
    prefix: Object.freeze([...route.prefix]),
    namePrefix: Object.freeze([...route.groupNamePrefix]),
    controller: fromOptional(route.groupController),
    domain: fromOptional(route.groupDomain),
    bindingScope: route.groupBindingScope,
    constraints: Object.freeze(projectRelation(route.groupConstraints, item => constraintData('group', item))),
});
export const routeDeclarationFlow = (route: RouteDeclarationAst): RouteDeclarationFlow => Object.freeze({
    method: route.method,
    target: fact('target', route.target, 'routeDeclarationParser', 'RouteTargetAst', 'route semantic resolver', 'non_empty'),
    bindings: fact('binding', Object.freeze([...route.bindings]), 'routeDeclarationParser', 'RouteBindingDeclarationAst[]', 'binding semantic resolver', cardinalityOf(route.bindings)),
    group: fact('group', routeGroup(route), 'mergeRouteGroupStates', 'RouteGroupData', 'route group semantic resolver', 'non_empty'),
    constraints: fact('constraint', routeConstraints(route), 'routeConstraintFact', 'RouteConstraintData[]', 'constraint semantic resolver', cardinalityOf(routeConstraints(route))),
    middleware: fact('middleware', Object.freeze([...route.middleware, ...route.routeMiddleware]), 'routeDeclarationParser', 'MiddlewareNameAst[]', 'middleware semantic resolver', cardinalityOf([...route.middleware, ...route.routeMiddleware])),
});
export const routeDeclarationDataFlow = (routes: readonly RouteDeclarationAst[]): readonly RouteDeclarationFlow[] => Object.freeze(projectRelation(routes, routeDeclarationFlow));
export const routeResourceFlow = (resource: RouteResourceDeclarationAst): RouteResourceFlow => Object.freeze({
    method: resource.method,
    resource: resource.resource,
    controller: resource.controller,
    middleware: fact('resource_middleware', Object.freeze([...resource.middleware]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver', cardinalityOf(resource.middleware)),
    exclusions: fact('resource_middleware', Object.freeze([...resource.middlewareExclusions]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver', cardinalityOf(resource.middlewareExclusions)),
});
export const routeResourceDataFlow = (resources: readonly RouteResourceDeclarationAst[]): readonly RouteResourceFlow[] => Object.freeze(projectRelation(resources, routeResourceFlow));
const node = <T>(id: string, kind: RouteDataFlowNodeKind, value: T, producer: string, model: string, consumer: string): RouteDataFlowNode<T> => Object.freeze({
    id,
    kind,
    value,
    provenance: provenance(producer, model, consumer),
});
const edge = (from: string, to: string, kind: RouteDataFlowFactKind, cardinality: Cardinality = 'non_empty'): RouteDataFlowEdge => Object.freeze({ from, to, kind, cardinality });
/**
 * Materializes the declaration flow as an explicit graph.
 * Data is carried by nodes; edges describe propagation only.
 */
export const routeDeclarationDataFlowGraph = (route: RouteDeclarationAst): RouteDataFlowGraph => {
    const source = node('route.source', 'source', route.source, 'routeScanner', 'RouteDeclarationAst', 'routeDeclarationParser');
    const syntax = node('route.syntax', 'syntax_fact', route, 'routeDeclarationParser', 'RouteDeclarationAst', 'route semantic resolver');
    const target = node('route.target', 'semantic_fact', route.target, 'routeDeclarationParser', 'RouteTargetAst', 'route semantic resolver');
    const bindings = node('route.bindings', 'semantic_fact', Object.freeze([...route.bindings]), 'routeDeclarationParser', 'RouteBindingDeclarationAst[]', 'binding semantic resolver');
    const group = node('route.group', 'semantic_fact', routeGroup(route), 'mergeRouteGroupStates', 'RouteGroupData', 'route group semantic resolver');
    const constraints = node('route.constraints', 'semantic_fact', routeConstraints(route), 'routeConstraintFact', 'RouteConstraintData[]', 'constraint semantic resolver');
    const middleware = node('route.middleware', 'semantic_fact', Object.freeze([...route.middleware, ...route.routeMiddleware]), 'routeDeclarationParser', 'MiddlewareNameAst[]', 'middleware semantic resolver');
    const consumer = node('route.consumer', 'consumer', route.method, 'route semantic resolver', 'RouteSemanticModel', 'route emitter');
    const nodes = Object.freeze([source, syntax, target, bindings, group, constraints, middleware, consumer]);
    const edges = Object.freeze([
        edge(source.id, syntax.id, 'route', 'non_empty'),
        edge(syntax.id, target.id, 'target', 'non_empty'),
        edge(syntax.id, bindings.id, 'binding', cardinalityOf(route.bindings)),
        edge(syntax.id, group.id, 'group', 'non_empty'),
        edge(syntax.id, constraints.id, 'constraint', cardinalityOf(routeConstraints(route))),
        edge(syntax.id, middleware.id, 'middleware', cardinalityOf([...route.middleware, ...route.routeMiddleware])),
        edge(target.id, consumer.id, 'target', 'non_empty'),
        edge(bindings.id, consumer.id, 'binding', cardinalityOf(route.bindings)),
        edge(group.id, consumer.id, 'group', 'non_empty'),
        edge(constraints.id, consumer.id, 'constraint', cardinalityOf(routeConstraints(route))),
        edge(middleware.id, consumer.id, 'middleware', cardinalityOf([...route.middleware, ...route.routeMiddleware])),
    ]);
    return Object.freeze({ nodes, edges });
};
export const routeDataFlowGraph = (routes: readonly RouteDeclarationAst[]): readonly RouteDataFlowGraph[] => Object.freeze(projectRelation(routes, routeDeclarationDataFlowGraph));
/** Explicit resource flow graph: source -> syntax facts -> semantic facts -> consumer. */
export const routeResourceDataFlowGraph = (resource: RouteResourceDeclarationAst): RouteDataFlowGraph => {
    const source = node('resource.source', 'source', resource.source, 'routeResourceScanner', 'RouteResourceDeclarationAst', 'routeResourceSyntaxRelation');
    const syntax = node('resource.syntax', 'syntax_fact', resource, 'routeResourceSyntaxRelation', 'RouteResourceDeclarationAst', 'resource semantic resolver');
    const middleware = node('resource.middleware', 'semantic_fact', Object.freeze([...resource.middleware]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver');
    const exclusions = node('resource.exclusions', 'semantic_fact', Object.freeze([...resource.middlewareExclusions]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver');
    const consumer = node('resource.consumer', 'consumer', resource.method, 'resource semantic resolver', 'RouteResourceContract', 'resource emitter');
    const nodes = Object.freeze([source, syntax, middleware, exclusions, consumer]);
    const edges = Object.freeze([
        edge(source.id, syntax.id, 'resource', 'non_empty'),
        edge(syntax.id, middleware.id, 'resource_middleware', cardinalityOf(resource.middleware)),
        edge(syntax.id, exclusions.id, 'resource_middleware', cardinalityOf(resource.middlewareExclusions)),
        edge(middleware.id, consumer.id, 'resource_middleware', cardinalityOf(resource.middleware)),
        edge(exclusions.id, consumer.id, 'resource_middleware', cardinalityOf(resource.middlewareExclusions)),
    ]);
    return Object.freeze({ nodes, edges });
};

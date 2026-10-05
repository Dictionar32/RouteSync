import { relationNotEqual, relationAny, relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationResolve, relationFirstOption, relationOptionFold, relationVariantFold, projectRelation, selectRelation, expandRelation, accumulateRelation, visitRelation } from '../../../relational/sequence';
import { absent, present, presenceOf, cardinalityOf, type Cardinality, type Presence } from '../../../../types/upstream/presence';
import type { RouteDeclarationAst, RouteTargetAst, LaravelRouteMethod, RouteConstraintArgumentAst } from './routeDeclarationAst';
import type { RouteFileContext } from '../../../../types/upstream/route';
import { createSourceFile, createControllerName, createDomainTypeName, createMiddlewareName, createRouteParameterName, stringValue } from '../../../../types/upstream/names';
import type { RouteGroupFact as RouteGroupValueFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteResourceDeclarationAst } from './routeResourceDeclarationAst';

/**
 * Route data-flow is a closed semantic fact algebra.
 * The graph is data, not a host-language control structure: every edge and
 * node carries an explicit relation kind, value domain, cardinality, and
 * provenance witness.
 */
export type RouteDataFlowStage = 'source' | 'syntax_fact' | 'semantic_fact' | 'consumer';
export type RouteDataFlowFactKind = 'route' | 'target' | 'binding' | 'group' | 'constraint' | 'middleware' | 'resource' | 'resource_middleware';
export type RouteDataFlowNodeKind = RouteDataFlowStage;

export interface RouteDataFlowProvenance {
    readonly source: RouteDataFlowStage;
    readonly producer: string;
    readonly model: string;
    readonly consumer: string;
}

export type RouteGroupData = RouteGroupValueFact;

export interface RouteConstraintData {
    readonly method: string;
    readonly parameter: string;
    readonly argument: RouteConstraintArgumentAst;
    readonly source: 'route' | 'group';
}

export interface RouteTargetFact { readonly kind: 'target'; readonly value: RouteTargetAst; readonly cardinality: Cardinality; readonly provenance: RouteDataFlowProvenance }
export interface RouteBindingFact { readonly kind: 'binding'; readonly value: RouteDeclarationAst['bindings']; readonly cardinality: Cardinality; readonly provenance: RouteDataFlowProvenance }
export interface RouteGroupFact { readonly kind: 'group'; readonly value: RouteGroupData; readonly cardinality: Cardinality; readonly provenance: RouteDataFlowProvenance }
export interface RouteConstraintFact { readonly kind: 'constraint'; readonly value: readonly RouteConstraintData[]; readonly cardinality: Cardinality; readonly provenance: RouteDataFlowProvenance }
export interface RouteMiddlewareFact { readonly kind: 'middleware'; readonly value: readonly string[]; readonly cardinality: Cardinality; readonly provenance: RouteDataFlowProvenance }
export interface RouteResourceMiddlewareFact { readonly kind: 'resource_middleware'; readonly value: RouteResourceDeclarationAst['middleware']; readonly cardinality: Cardinality; readonly provenance: RouteDataFlowProvenance }
export type RouteDataFlowFact = RouteTargetFact | RouteBindingFact | RouteGroupFact | RouteConstraintFact | RouteMiddlewareFact | RouteResourceMiddlewareFact;

export type RouteDataFlowNodeValue =
    | RouteDeclarationAst['source']
    | RouteDeclarationAst
    | RouteTargetAst
    | RouteDeclarationAst['bindings']
    | RouteGroupData
    | readonly RouteConstraintData[]
    | readonly string[]
    | LaravelRouteMethod
    | RouteResourceDeclarationAst['method']
    | RouteResourceDeclarationAst;

export type RouteDataFlowNode =
    | { readonly id: string; readonly kind: 'source'; readonly value: RouteDeclarationAst['source'] | RouteResourceDeclarationAst['source']; readonly provenance: RouteDataFlowProvenance }
    | { readonly id: string; readonly kind: 'syntax_fact'; readonly value: RouteDeclarationAst | RouteResourceDeclarationAst; readonly provenance: RouteDataFlowProvenance }
    | { readonly id: string; readonly kind: 'semantic_fact'; readonly value: RouteTargetAst | RouteDeclarationAst['bindings'] | RouteGroupData | readonly RouteConstraintData[] | readonly string[]; readonly provenance: RouteDataFlowProvenance }
    | { readonly id: string; readonly kind: 'consumer'; readonly value: LaravelRouteMethod | RouteResourceDeclarationAst['method']; readonly provenance: RouteDataFlowProvenance };

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

export type RouteDeclarationSemanticKind = 'resource' | 'api_resource' | 'singleton' | 'api_singleton' | 'standard';
const ROUTE_DECLARATION_SEMANTIC_KIND: Readonly<Record<LaravelRouteMethod, RouteDeclarationSemanticKind>> = Object.freeze({
    resource: 'resource',
    apiResource: 'api_resource',
    singleton: 'singleton',
    apiSingleton: 'api_singleton',
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

export type RouteMethodSemanticKind = 'all_methods' | 'match' | 'standard';
const ROUTE_METHOD_SEMANTIC_KIND: Readonly<Record<LaravelRouteMethod, RouteMethodSemanticKind>> = Object.freeze({
    resource: 'standard',
    apiResource: 'standard',
    singleton: 'standard',
    apiSingleton: 'standard',
    get: 'standard',
    post: 'standard',
    put: 'standard',
    patch: 'standard',
    delete: 'standard',
    options: 'standard',
    head: 'standard',
    match: 'match',
    any: 'all_methods',
});
export const routeMethodSemanticKind = (method: LaravelRouteMethod): RouteMethodSemanticKind => ROUTE_METHOD_SEMANTIC_KIND[method];

/** Canonical route-file context; the lexer exposes the upstream vocabulary directly. */
export type RouteSourceFileContext = RouteFileContext;

const ROUTE_SOURCE_FILE_CONTEXT_KNOWLEDGE: Readonly<Record<'api_routes' | 'web_routes', readonly string[]>> = Object.freeze({
    api_routes: Object.freeze(['routes/api.php']),
    web_routes: Object.freeze(['routes/web.php']),
});
const normalizeRouteSourcePath = (sourcePath: string): string => sourcePath.split('\\').join('/');
const ROUTE_SOURCE_FILE_CONTEXT_READERS = Object.freeze([
    (normalized: string): Presence<RouteSourceFileContext> => relationResolve(
        relationAny([relationEqual(normalized, ROUTE_SOURCE_FILE_CONTEXT_KNOWLEDGE.api_routes[0]), normalized.endsWith('/routes/api.php')]),
        () => present({ kind: 'api_routes' }),
        () => absent<RouteSourceFileContext>(),
    ),
    (normalized: string): Presence<RouteSourceFileContext> => relationResolve(
        relationAny([relationEqual(normalized, ROUTE_SOURCE_FILE_CONTEXT_KNOWLEDGE.web_routes[0]), normalized.endsWith('/routes/web.php')]),
        () => present({ kind: 'web_routes' }),
        () => absent<RouteSourceFileContext>(),
    ),
]);
export const routeSourceFileContextKnowledge = (sourcePath: string): RouteFileContext => {
    const normalized = normalizeRouteSourcePath(sourcePath);
    const resolved = relationFirstOption(ROUTE_SOURCE_FILE_CONTEXT_READERS, reader => relationResolve(relationEqual(reader(normalized).kind, 'present'), () => true, () => false));
    return relationOptionFold(resolved, () => ({ kind: 'custom_routes' as const, file: createSourceFile(normalized) }), reader => reader(normalized).value);
};

export interface RouteDeclarationFlow {
    readonly method: LaravelRouteMethod;
    readonly target: RouteTargetFact;
    readonly bindings: RouteBindingFact;
    readonly group: RouteGroupFact;
    readonly constraints: RouteConstraintFact;
    readonly middleware: RouteMiddlewareFact;
}

export interface RouteResourceFlow {
    readonly method: RouteResourceDeclarationAst['method'];
    readonly resource: string;
    readonly controller: string;
    readonly middleware: RouteResourceMiddlewareFact;
    readonly exclusions: RouteResourceMiddlewareFact;
}

const provenance = (producer: string, model: string, consumer: string): RouteDataFlowProvenance => Object.freeze({
    source: 'syntax_fact',
    producer,
    model,
    consumer,
});
const targetFact = (value: RouteTargetAst, producer: string, model: string, consumer: string, cardinality: Cardinality): RouteTargetFact => Object.freeze({ kind: 'target', value, cardinality, provenance: provenance(producer, model, consumer) });
const bindingFact = (value: RouteDeclarationAst['bindings'], producer: string, model: string, consumer: string, cardinality: Cardinality): RouteBindingFact => Object.freeze({ kind: 'binding', value, cardinality, provenance: provenance(producer, model, consumer) });
const groupFact = (value: RouteGroupData, producer: string, model: string, consumer: string): RouteGroupFact => Object.freeze({ kind: 'group', value, cardinality: 'non_empty', provenance: provenance(producer, model, consumer) });
const constraintFact = (value: readonly RouteConstraintData[], producer: string, model: string, consumer: string, cardinality: Cardinality): RouteConstraintFact => Object.freeze({ kind: 'constraint', value, cardinality, provenance: provenance(producer, model, consumer) });
const middlewareFact = (value: readonly string[], producer: string, model: string, consumer: string, cardinality: Cardinality): RouteMiddlewareFact => Object.freeze({ kind: 'middleware', value, cardinality, provenance: provenance(producer, model, consumer) });
const resourceMiddlewareFact = (value: RouteResourceDeclarationAst['middleware'], producer: string, model: string, consumer: string, cardinality: Cardinality): RouteResourceMiddlewareFact => Object.freeze({ kind: 'resource_middleware', value, cardinality, provenance: provenance(producer, model, consumer) });

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
    prefix: Object.freeze(projectRelation(route.prefix, stringValue)),
    middleware: Object.freeze(projectRelation([...route.middleware], createMiddlewareName)),
    namePrefix: Object.freeze(projectRelation(route.groupNamePrefix, stringValue)),
    controller: route.groupController ? present(createControllerName(route.groupController)) : absent(),
    domain: route.groupDomain ? present(createDomainTypeName(route.groupDomain)) : absent(),
    bindingScope: route.groupBindingScope,
    constraints: Object.freeze(projectRelation(route.groupConstraints, item => Object.freeze({
        parameter: createRouteParameterName(item.parameter),
        method: item.method,
        argument: relationVariantFold(item.argument, 'pattern',
            () => ({ kind: 'none' as const }),
            rest => relationVariantFold(rest, 'values',
                () => ({ kind: 'none' as const }),
                values => ({ kind: 'values' as const, values: projectRelation(values.values, value => stringValue(value.value)) }),
                () => ({ kind: 'none' as const })),
            pattern => ({ kind: 'pattern' as const, value: stringValue(pattern.value) })),
        source: { kind: 'group' as const },
    }))),
});

export const routeDeclarationFlow = (route: RouteDeclarationAst): RouteDeclarationFlow => Object.freeze({
    method: route.method,
    target: targetFact(route.target, 'routeDeclarationParser', 'RouteTargetAst', 'route semantic resolver', 'non_empty'),
    bindings: bindingFact(Object.freeze([...route.bindings]), 'routeDeclarationParser', 'RouteBindingDeclarationAst[]', 'binding semantic resolver', cardinalityOf(route.bindings)),
    group: groupFact(routeGroup(route), 'mergeRouteGroupStates', 'RouteGroupFact', 'route group semantic resolver'),
    constraints: constraintFact(routeConstraints(route), 'routeConstraintFact', 'RouteConstraintData[]', 'constraint semantic resolver', cardinalityOf(routeConstraints(route))),
    middleware: middlewareFact(Object.freeze([...route.middleware, ...route.routeMiddleware]), 'routeDeclarationParser', 'MiddlewareNameAst[]', 'middleware semantic resolver', cardinalityOf([...route.middleware, ...route.routeMiddleware])),
});
export const routeDeclarationDataFlow = (routes: readonly RouteDeclarationAst[]): readonly RouteDeclarationFlow[] => Object.freeze(projectRelation(routes, routeDeclarationFlow));
export const routeResourceFlow = (resource: RouteResourceDeclarationAst): RouteResourceFlow => Object.freeze({
    method: resource.method,
    resource: resource.resource,
    controller: resource.controller,
    middleware: resourceMiddlewareFact(Object.freeze([...resource.middleware]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver', cardinalityOf(resource.middleware)),
    exclusions: resourceMiddlewareFact(Object.freeze([...resource.middlewareExclusions]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver', cardinalityOf(resource.middlewareExclusions)),
});
export const routeResourceDataFlow = (resources: readonly RouteResourceDeclarationAst[]): readonly RouteResourceFlow[] => Object.freeze(projectRelation(resources, routeResourceFlow));

interface RouteSourceNode { readonly id: string; readonly kind: 'source'; readonly value: RouteDeclarationAst['source'] | RouteResourceDeclarationAst['source']; readonly provenance: RouteDataFlowProvenance }
interface RouteSyntaxNode { readonly id: string; readonly kind: 'syntax_fact'; readonly value: RouteDeclarationAst | RouteResourceDeclarationAst; readonly provenance: RouteDataFlowProvenance }
interface RouteSemanticNode { readonly id: string; readonly kind: 'semantic_fact'; readonly value: RouteTargetAst | RouteDeclarationAst['bindings'] | RouteGroupData | readonly RouteConstraintData[] | readonly string[]; readonly provenance: RouteDataFlowProvenance }
interface RouteConsumerNode { readonly id: string; readonly kind: 'consumer'; readonly value: LaravelRouteMethod | RouteResourceDeclarationAst['method']; readonly provenance: RouteDataFlowProvenance }
const sourceNode = (id: string, value: RouteDeclarationAst['source'] | RouteResourceDeclarationAst['source'], producer: string, model: string, consumer: string): RouteSourceNode => Object.freeze({ id, kind: 'source', value, provenance: provenance(producer, model, consumer) });
const syntaxNode = (id: string, value: RouteDeclarationAst | RouteResourceDeclarationAst, producer: string, model: string, consumer: string): RouteSyntaxNode => Object.freeze({ id, kind: 'syntax_fact', value, provenance: provenance(producer, model, consumer) });
const semanticNode = (id: string, value: RouteTargetAst | RouteDeclarationAst['bindings'] | RouteGroupData | readonly RouteConstraintData[] | readonly string[], producer: string, model: string, consumer: string): RouteSemanticNode => Object.freeze({ id, kind: 'semantic_fact', value, provenance: provenance(producer, model, consumer) });
const consumerNode = (id: string, value: LaravelRouteMethod | RouteResourceDeclarationAst['method'], producer: string, model: string, consumer: string): RouteConsumerNode => Object.freeze({ id, kind: 'consumer', value, provenance: provenance(producer, model, consumer) });
const edge = (from: string, to: string, kind: RouteDataFlowFactKind, cardinality: Cardinality = 'non_empty'): RouteDataFlowEdge => Object.freeze({ from, to, kind, cardinality });

export const routeDeclarationDataFlowGraph = (route: RouteDeclarationAst): RouteDataFlowGraph => {
    const source = sourceNode('route.source', route.source, 'routeScanner', 'RouteDeclarationAst', 'routeDeclarationParser');
    const syntax = syntaxNode('route.syntax', route, 'routeDeclarationParser', 'RouteDeclarationAst', 'route semantic resolver');
    const target = semanticNode('route.target', route.target, 'routeDeclarationParser', 'RouteTargetAst', 'route semantic resolver');
    const bindings = semanticNode('route.bindings', Object.freeze([...route.bindings]), 'routeDeclarationParser', 'RouteBindingDeclarationAst[]', 'binding semantic resolver');
    const group = semanticNode('route.group', routeGroup(route), 'mergeRouteGroupStates', 'RouteGroupFact', 'route group semantic resolver');
    const constraints = semanticNode('route.constraints', routeConstraints(route), 'routeConstraintFact', 'RouteConstraintData[]', 'constraint semantic resolver');
    const middleware = semanticNode('route.middleware', Object.freeze([...route.middleware, ...route.routeMiddleware]), 'routeDeclarationParser', 'MiddlewareNameAst[]', 'middleware semantic resolver');
    const consumer = consumerNode('route.consumer', route.method, 'route semantic resolver', 'RouteSemanticModel', 'route emitter');
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

export const routeResourceDataFlowGraph = (resource: RouteResourceDeclarationAst): RouteDataFlowGraph => {
    const source = sourceNode('resource.source', resource.source, 'routeResourceScanner', 'RouteResourceDeclarationAst', 'routeResourceSyntaxRelation');
    const syntax = syntaxNode('resource.syntax', resource, 'routeResourceSyntaxRelation', 'RouteResourceDeclarationAst', 'resource semantic resolver');
    const middleware = semanticNode('resource.middleware', Object.freeze([...resource.middleware]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver');
    const exclusions = semanticNode('resource.exclusions', Object.freeze([...resource.middlewareExclusions]), 'routeResourceSyntaxRelation', 'RouteResourceMiddlewareAst[]', 'resource middleware semantic resolver');
    const consumer = consumerNode('resource.consumer', resource.method, 'resource semantic resolver', 'RouteResourceContract', 'resource emitter');
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

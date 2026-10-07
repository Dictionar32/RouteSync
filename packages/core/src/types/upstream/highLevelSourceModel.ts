import type { ModelAst, ServiceAst, ProviderAst } from './ast';
import type { ControllerMethod } from './controller';
import { matchRequestValidationCapability } from './request';
import type { RouteDefinition } from './route';
import type { SourceSpan } from './provenance';
import type { SourceFile } from './names';
import { matchDiscovered, matchSourceDiscovery } from './collections';
import type { Sequence } from './collections';
import type { ModelReference, ResourceReference, RequestReference, ResponseReference, RouteReference, ChannelReference, ServiceReference, ControllerReference, ClassReference, SemanticRelationGraph } from './semanticReferences';
import type { EffectiveControllerActionPolicy } from './effectiveControllerActionPolicy';
import { controllerActionPolicyRelations, controllerActionPolicyRelationsFromEvidence } from './controllerActionPolicyRelations';
import { routeActionPolicyRelations, routeActionPolicyRelationsFromEffectivePolicy } from './routeActionPolicyRelations';
import { resolveEffectiveControllerActionPolicyUpstream } from './effectiveControllerActionPolicyResolver';
import { resolveServiceDependencyTarget, type ResolvedServiceDependencies } from './service';
import type { ModelHighLevelContract, ProviderHighLevelContract, ResourceHighLevelContract, RequestHighLevelContract, ResponseHighLevelContract, RouteHighLevelContract, ServiceHighLevelContract, ServiceSemanticContract, ControllerActionHighLevelContract, ControllerActionFlowContract, LaravelSemanticContractCatalog } from './highLevelContracts';

import type { RequestFieldTarget } from './request';
import type { EndpointResponseBinding, EndpointRequestBinding } from './endpointBindings';
import type { RouteTarget } from './route';
import { relationEqual, relationExpand, relationFirstOption, relationFoldRight, relationOptionFold, relationProject, relationResolve, relationVariantFold } from '../../semantic/foundation/relationalSequence';

type RequestPropertyRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'request_property' }>;
type ControllerDependencyRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'controller_dependency' }>;
type RouteResponseRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_response' }>;
type RouteControllerRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_controller' }>;

/**
 * Semantic projection knowledge. Syntax/control-flow variants are represented
 * as data dispatch tables; consumers interpret the resulting relations.
 */
const REQUEST_PROPERTY_RELATION_MODEL: Readonly<Record<RequestFieldTarget['kind'], (request: RequestReference, target: RequestFieldTarget) => readonly RequestPropertyRelation[]>> = Object.freeze({
  input_property: (request, target) => [{ kind: 'request_property', request, property: target.property }],
  input_collection: (request, target) => relationVariantFold(target, 'input_collection', () => [], value => [
    { kind: 'request_property', request, property: value.property },
    { kind: 'request_property', request, property: value.element },
  ]),
});

const ROUTE_REQUEST_RELATION_MODEL: Readonly<Record<EndpointRequestBinding['kind'], (route: RouteReference, request: EndpointRequestBinding) => ReadonlyArray<Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_request' }>>>> = Object.freeze({
  form_request: (route, request) => relationVariantFold(request, 'form_request', () => [], value => [{ kind: 'route_request', route, request: value.request }]),
  framework_request: () => [],
  inline_input: () => [],
  no_input: () => [],
});

const ROUTE_RESPONSE_RELATION_MODEL: Readonly<Record<EndpointResponseBinding['kind'], (route: RouteReference, response: EndpointResponseBinding) => readonly RouteResponseRelation[]>> = Object.freeze({
  declared_response: (route, response) => relationVariantFold(response, 'declared_response', () => [], value => [{ kind: 'route_response', route, response: value.response }]),
  inline_response: () => [],
  redirect_response: () => [],
  file_response: () => [],
  empty_response: () => [],
});

const ROUTE_TARGET_RELATION_MODEL: Readonly<Record<RouteTarget['kind'], (route: RouteReference, target: RouteTarget) => readonly RouteControllerRelation[]>> = Object.freeze({
  controller_action: (route, target) => relationVariantFold(target, 'controller_action', () => [], value => [{ kind: 'route_controller', route, controller: value.controller }]),
  controller_invokable: (route, target) => relationVariantFold(target, 'controller_invokable', () => [], value => [{ kind: 'route_controller', route, controller: value.controller }]),
  closure: () => [],
  redirect: () => [],
  view: () => [],
  fallback: () => [],
});

export interface SourceProjectIdentity {
  readonly kind: 'laravel_project';
  readonly root: SourceFile;
  readonly source: SourceSpan;
}

export interface ModelSemanticNode {
  readonly kind: 'model_semantic_node';
  readonly identity: ModelReference;
  readonly definition: ModelHighLevelContract;
  readonly source: SourceSpan;
}

export function modelSemanticNodeFromAst(ast: ModelAst): ModelSemanticNode {
  return {
    kind: 'model_semantic_node',
    identity: { kind: 'model_reference', name: ast.definition.identity.name },
    definition: ast.definition,
    source: ast.source
  };
}

export interface ResourceSemanticNode {
  readonly kind: 'resource_semantic_node';
  readonly identity: ResourceReference;
  readonly definition: ResourceHighLevelContract;
  readonly source: SourceSpan;
}

export interface RequestSemanticNode {
  readonly kind: 'request_semantic_node';
  readonly identity: RequestReference;
  readonly definition: RequestHighLevelContract;
  readonly source: SourceSpan;
}

export interface ResponseSemanticNode {
  readonly kind: 'response_semantic_node';
  readonly identity: ResponseReference;
  readonly definition: ResponseHighLevelContract;
  readonly source: SourceSpan;
}

export interface ControllerSemanticNode {
  readonly kind: 'controller_semantic_node';
  readonly identity: ControllerReference;
  readonly action: ControllerActionFlowContract;
  readonly source: SourceSpan;
}

export interface ServiceSemanticNode {
  readonly kind: 'service_semantic_node';
  readonly identity: ServiceReference;
  readonly definition: ServiceHighLevelContract;
  readonly resolvedDependencies: ResolvedServiceDependencies;
  readonly source: SourceSpan;
}

export interface ChannelSemanticNode {
  readonly kind: 'channel_semantic_node';
  readonly identity: ChannelReference;
  readonly definition: import('./channel').ChannelDefinition;
  readonly source: SourceSpan;
}

export interface RouteSemanticNode {
  readonly kind: 'route_semantic_node';
  readonly identity: RouteReference;
  readonly definition: RouteHighLevelContract;
  readonly source: SourceSpan;
}

const modelNodeFromAst = (ast: ModelAst): ModelSemanticNode => modelSemanticNodeFromAst(ast);
const serviceNodeFromAst = (ast: ServiceAst): ServiceSemanticNode => ({
  kind: 'service_semantic_node',
  identity: { kind: 'service_reference', name: ast.definition.name },
  definition: ast.definition,
  resolvedDependencies: { kind: 'resolved_service_dependencies', items: { kind: 'empty' } },
  source: ast.source,
});


const routeNodeFromAst = (ast: import('./ast').RouteAst): RouteSemanticNode => {
  const identity: RouteReference = { kind: 'route_reference', name: ast.definition.identity.key };
  return {
    kind: 'route_semantic_node',
    identity,
    definition: ast.definition,
    source: ast.source,
  };
};

export interface ProviderSemanticNode {
  readonly kind: 'provider_semantic_node';
  readonly identity: import('./names').ClassName;
  readonly definition: ProviderHighLevelContract;
  readonly source: SourceSpan;
}

export interface SourceModelCatalog {
  readonly kind: 'source_model_catalog';
  readonly controllers: Sequence<ControllerSemanticNode>;
  readonly providers: Sequence<ProviderSemanticNode>;
  readonly models: Sequence<ModelSemanticNode>;
  readonly resources: Sequence<ResourceSemanticNode>;
  readonly requests: Sequence<RequestSemanticNode>;
  readonly responses: Sequence<ResponseSemanticNode>;
  readonly services: Sequence<ServiceSemanticNode>;
  readonly routes: Sequence<RouteSemanticNode>;
  readonly channels: Sequence<ChannelSemanticNode>;
}

export interface SourceModelReferenceIndex {
  readonly kind: 'source_model_reference_index';
  readonly controllers: Sequence<ControllerReference>;
  readonly models: Sequence<ModelReference>;
  readonly resources: Sequence<ResourceReference>;
  readonly requests: Sequence<RequestReference>;
  readonly responses: Sequence<ResponseReference>;
  readonly routes: Sequence<RouteReference>;
  readonly graph: SemanticRelationGraph;
}

const sequenceToArray = <T>(items: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  relationResolve(
    relationEqual(items.kind, 'empty'),
    () => output,
    () => relationVariantFold(items, 'cons', () => output, item => sequenceToArray(item.tail, Object.freeze([...output, item.head]))),
  );

const sequenceProject = <T, R>(items: Sequence<T>, project: (item: T) => R, output: readonly R[] = []): readonly R[] =>
  relationResolve(
    relationEqual(items.kind, 'empty'),
    () => output,
    () => relationVariantFold(items, 'cons', () => output, item => sequenceProject(item.tail, project, Object.freeze([...output, project(item.head)])),)
  );

const sequenceExpand = <T, R>(items: Sequence<T>, expand: (item: T) => readonly R[], output: readonly R[] = []): readonly R[] =>
  relationResolve(
    relationEqual(items.kind, 'empty'),
    () => output,
    () => relationVariantFold(items, 'cons', () => output, item => sequenceExpand(item.tail, expand, Object.freeze([...output, ...expand(item.head)])),)
  );

const sequenceFromArray = <T>(items: readonly T[], index = 0): Sequence<T> =>
  relationResolve(
    relationEqual(index, items.length),
    () => ({ kind: 'empty' as const }),
    () => ({ kind: 'cons' as const, head: items[index], tail: sequenceFromArray(items, index + 1) }),
  );


const routeMiddlewareContractsFromDefinition = (route: RouteSemanticNode) =>
  Object.freeze(sequenceToArray(route.definition.capability.middleware.items).map(entry => Object.freeze({
    middleware: { name: entry.name, parameters: [] },
    source: { kind: entry.kind === 'inherited' ? 'route_group' as const : 'route' as const },
    scope: { kind: 'all' as const },
  })));

const routeResourceMiddlewareContractsFromDefinition = (route: RouteSemanticNode) => {
  const special = route.definition.special;
  const resource = special.kind === 'resource' || special.kind === 'api_resource' || special.kind === 'singleton' || special.kind === 'api_singleton'
    ? special.resource
    : undefined;
  if (!resource) return { declarations: [], exclusions: [] };
  const rules = sequenceToArray(resource.middleware);
  const declarations = rules.flatMap(rule => sequenceToArray(rule.include).map(name => Object.freeze({
    middleware: { name, parameters: [] },
    source: { kind: 'resource' as const },
    scope: rule.scope,
  })));
  const exclusions = rules.flatMap(rule => sequenceToArray(rule.exclude).map(name => Object.freeze({
    middleware: { name, parameters: [] },
    source: { kind: 'resource' as const },
    scope: rule.scope,
  })));
  return { declarations: Object.freeze(declarations), exclusions: Object.freeze(exclusions) };
};

const effectiveRouteActionPolicyRelations = (
  catalog: SourceModelCatalog,
  route: RouteSemanticNode,
  suppliedPolicies: readonly EffectiveControllerActionPolicy[] = [],
): readonly import('./routeActionPolicyRelations').RouteActionPolicyRelation[] => {
  const target = route.definition.bindings.target;
  if (target.kind !== 'controller_action') return [];
  const suppliedPolicy = suppliedPolicies.find(policy =>
    policy.controller.value.value === target.controller.name.value.value
    && policy.action.value.value === target.controller.action.value.value,
  );
  if (suppliedPolicy) {
    const routePolicy = resolveEffectiveControllerActionPolicyUpstream({
      controller: suppliedPolicy.controller,
      action: suppliedPolicy.action,
      middleware: {
        declarations: Object.freeze([
          ...routeMiddlewareContractsFromDefinition(route),
          ...routeResourceMiddlewareContractsFromDefinition(route).declarations,
          ...suppliedPolicy.middleware,
        ]),
        exclusions: routeResourceMiddlewareContractsFromDefinition(route).exclusions,
        action: { kind: 'present', value: suppliedPolicy.action },
      },
      policy: [],
      inheritedFrom: suppliedPolicy.inheritedFrom,
      source: Object.freeze([...suppliedPolicy.source, route.definition.provenance.span]),
    });
    return routeActionPolicyRelationsFromEffectivePolicy(route.identity, Object.freeze({
      ...routePolicy,
      authorization: suppliedPolicy.authorization,
    }));
  }

  const routeResourceMiddleware = routeResourceMiddlewareContractsFromDefinition(route);
  const controllers = sequenceToArray(catalog.controllers);
  const controller = controllers.find(candidate =>
    candidate.identity.name.value.value === target.controller.name.value.value
    && candidate.identity.action.value.value === target.controller.action.value.value,
  );
  if (!controller) {
    return routeActionPolicyRelations(
      route.identity,
      target.controller,
      routeMiddlewareContractsFromDefinition(route),
      route.definition.provenance.span,
    );
  }
  const policy = resolveEffectiveControllerActionPolicyUpstream({
    controller: controller.identity.name,
    action: controller.identity.action,
    middleware: {
      declarations: Object.freeze([
        ...routeMiddlewareContractsFromDefinition(route),
        ...routeResourceMiddleware.declarations,
      ]),
      exclusions: Object.freeze(routeResourceMiddleware.exclusions),
      action: { kind: 'present', value: controller.identity.action },
    },
    policy: sequenceToArray(controller.action.policy),
    inheritedFrom: controller.action.inheritedFrom,
    source: Object.freeze([route.definition.provenance.span, controller.action.source]),
  });
  return routeActionPolicyRelationsFromEffectivePolicy(route.identity, policy);
};

export function sourceModelReferenceIndexFromCatalog(
  catalog: SourceModelCatalog,
  effectivePolicies: readonly EffectiveControllerActionPolicy[] = [],
): SourceModelReferenceIndex {
  const modelNodes: readonly ModelSemanticNode[] = sequenceToArray(catalog.models);
  const relationValues = Object.freeze([
    ...effectivePolicies.flatMap(policy => controllerActionPolicyRelations(policy)),
    ...sequenceExpand(catalog.routes, route => {
      return effectiveRouteActionPolicyRelations(catalog, route, effectivePolicies);
    }),
    ...sequenceExpand(catalog.controllers, controller => [
      ...controllerActionPolicyRelationsFromEvidence(
        controller.identity.name,
        controller.identity.action,
        sequenceToArray(controller.action.policy),
        controller.action.inheritedFrom,
      ),
      ...sequenceExpand(controller.action.semantic.resources, resource => [
        { kind: 'controller_resource' as const, controller: controller.identity, resource: resource.resource },
        { kind: 'controller_model' as const, controller: controller.identity, model: resource.model },
        { kind: 'controller_response' as const, controller: controller.identity, response: resource.response },
      ]),
      ...sequenceExpand(controller.action.dependencies, dependency => {
        const modelNames = sequenceProject(catalog.models, model => model.identity.name);
        const serviceNames = sequenceProject(catalog.services, service => service.identity.name);
        const resolved = resolveServiceDependencyTarget(dependency.type, modelNames, serviceNames);
        return [{
          kind: 'controller_dependency' as const,
          controller: controller.identity,
          dependency: resolved,
        } satisfies ControllerDependencyRelation];
      }),
    ]),
    ...relationExpand(modelNodes, model => relationProject(model.definition.semantic.relation.semantic, relation => ({
      kind: 'model_relation' as const,
      model: model.identity,
      target: { kind: 'model_reference' as const, name: relation.targetModel },
      relation,
    }))),
    ...sequenceExpand(catalog.resources, resource => [
      { kind: 'resource_model' as const, resource: resource.identity, model: resource.definition.model },
      { kind: 'response_resource' as const, response: resource.definition.response, resource: resource.identity },
    ]),
    ...sequenceExpand(catalog.requests, request => {
      const fields = matchRequestValidationCapability(request.definition.validation, {
        no_form_request_validation: () => ({ kind: 'empty' as const }),
        form_request_validation: value => value.schema.fields.items,
      });
      return sequenceExpand(fields, field => REQUEST_PROPERTY_RELATION_MODEL[field.target.kind](request.identity, field.target));
    }),
    ...sequenceExpand(catalog.routes, route => {
      const request = route.definition.bindings.request;
      const response = route.definition.bindings.response;
      const target = route.definition.bindings.target;
      return [
        ...ROUTE_REQUEST_RELATION_MODEL[request.kind](route.identity, request),
        ...ROUTE_RESPONSE_RELATION_MODEL[response.kind](route.identity, response),
        ...ROUTE_TARGET_RELATION_MODEL[target.kind](route.identity, target),
      ];
    }),
  ]);

  return {
    kind: 'source_model_reference_index',
    controllers: sequenceFromArray(sequenceProject(catalog.controllers, node => node.identity)),
    models: sequenceFromArray(sequenceProject(catalog.models, node => node.identity)),
    resources: sequenceFromArray(sequenceProject(catalog.resources, node => node.identity)),
    requests: sequenceFromArray(sequenceProject(catalog.requests, node => node.identity)),
    responses: sequenceFromArray(sequenceProject(catalog.responses, node => node.identity)),
    routes: sequenceFromArray(sequenceProject(catalog.routes, node => node.identity)),
    graph: { kind: 'semantic_relation_graph', relations: sequenceFromArray(relationValues) },
  };
}

/**
 * Canonical projection boundary from semantic nodes into Laravel contracts.
 * The projection preserves node-owned semantic values; it does not create a
 * second semantic source. Consumers should depend on this interface rather
 * than the scanner/catalog implementation.
 */
export function semanticContractCatalogFromSourceCatalog(catalog: SourceModelCatalog): LaravelSemanticContractCatalog {
  const collectContracts = <N, C>(items: Sequence<N>, getContract: (node: N) => C): Sequence<C> =>
    sequenceFromArray(sequenceProject(items, getContract));

  return {
    models: collectContracts(catalog.models, node => node.definition),
    resources: collectContracts(catalog.resources, node => node.definition),
    requests: collectContracts(catalog.requests, node => node.definition),
    responses: collectContracts(catalog.responses, node => node.definition),
    routes: collectContracts(catalog.routes, node => node.definition),
    controllers: collectContracts(catalog.controllers, node => node.action),
    providers: collectContracts(catalog.providers, node => node.definition),
    services: collectContracts(catalog.services, node => ({
      ...node.definition,
      resolvedDependencies: node.resolvedDependencies,
    } satisfies ServiceSemanticContract)),
  };
}


export interface SemanticContractSeeds {
  readonly models: readonly import('./model').ModelDefinition[];
  readonly resources: readonly import('./resource').ResourceDefinition[];
  readonly requests: readonly import('./request').RequestDefinition[];
  readonly providers: readonly import('./application').ProviderDefinition[];
  readonly services: readonly import('./service').ServiceDefinition[];
  readonly responses: readonly import('./response').ResponseDefinition[];
}

export interface CompleteLaravelSourceModel {
  readonly kind: 'complete_laravel_source_model';
  readonly identity: SourceProjectIdentity;
  /**
   * Canonical upstream semantic boundary. AST/ADT catalog structures are
   * construction details and are intentionally not exposed to consumers.
   */
  readonly contracts: LaravelSemanticContractCatalog;
  /** Canonical semantic relation graph derived once from the source catalog. */
  readonly relations: SemanticRelationGraph;
}

export interface CompleteSourceModelBuildResult
{ readonly kind: 'complete_source_model'; readonly value: CompleteLaravelSourceModel }

export function buildCompleteLaravelSourceModel(
  ast: import('./ast').CompleteSourceAst,
  identity: SourceProjectIdentity,
  seeds: SemanticContractSeeds,
): CompleteSourceModelBuildResult {
  const source = ast.ast;
  const completeItems = <T>(discovery: import('./collections').SourceDiscovery<T>): Sequence<T> => matchSourceDiscovery(discovery, {
    notScanned: () => { throw Error('CompleteSourceAst invariant violated: source category was not scanned.'); },
    scanned: scanned => matchDiscovered(scanned.result, {
      empty: () => ({ kind: 'empty' }),
      many: value => value.items,
    }),
  });
  const controllers = source.controllerActions;
  const providers = seeds.providers;
  const models = completeItems(source.models.items);
  const responses = seeds.responses;
  const services = seeds.services;
  const routes = completeItems(source.routes.items);
  const channels = completeItems(source.channels.items);

  const catalog: SourceModelCatalog = {
    kind: 'source_model_catalog',
    providers: sequenceFromArray(relationProject(providers, definition => ({
      kind: 'provider_semantic_node' as const,
      identity: definition.name,
      definition,
      source: definition.source,
    }))),
    controllers: sequenceFromArray(relationProject(controllers, action => ({
      kind: 'controller_semantic_node' as const,
      identity: { kind: 'controller_reference' as const, name: action.controller, action: action.action },
      action,
      source: action.source,
    }))),
    models: sequenceFromArray(relationProject(seeds.models, definition => ({
      kind: 'model_semantic_node' as const,
      identity: { kind: 'model_reference' as const, name: definition.identity.name },
      definition,
      source: definition.source,
    }))),
    resources: sequenceFromArray(
      relationProject(seeds.resources, definition => ({
            kind: 'resource_semantic_node' as const,
            identity: { kind: 'resource_reference' as const, name: definition.name },
            definition,
            source: definition.source,
          })),
    ),
    requests: sequenceFromArray(
      relationProject(seeds.requests, definition => ({
            kind: 'request_semantic_node' as const,
            identity: { kind: 'request_reference' as const, name: definition.identity.request },
            definition,
            source: definition.source,
          })),
    ),
    responses: sequenceFromArray(relationProject(responses, definition => ({
      kind: 'response_semantic_node' as const,
      identity: { kind: 'response_reference' as const, name: definition.typeName },
      definition,
      source: definition.source,
    }))),
    services: sequenceFromArray(relationProject(services, definition => {
      const modelNames = sequenceProject(models, model => model.definition.identity.name);
      const serviceNames = services.map(service => service.name);
      const resolved = sequenceProject(definition.dependencies.items, fact => ({
        kind: 'resolved_service_dependency' as const,
        fact,
        target: resolveServiceDependencyTarget(fact.target, modelNames, serviceNames),
      }));
      return {
        kind: 'service_semantic_node' as const,
        identity: { kind: 'service_reference' as const, name: definition.name },
        definition,
        resolvedDependencies: { kind: 'resolved_service_dependencies', items: sequenceFromArray(resolved) },
        source: definition.source,
      };
    })),
    routes: sequenceFromArray(sequenceProject(routes, routeNodeFromAst)),
    channels: sequenceFromArray(sequenceProject(channels, astItem => ({
      kind: 'channel_semantic_node',
      identity: { kind: 'channel_reference', name: astItem.definition.name },
      definition: astItem.definition,
      source: astItem.source,
    }))),
  };

  const contracts = semanticContractCatalogFromSourceCatalog(catalog);

  return {
    kind: 'complete_source_model',
    value: {
      kind: 'complete_laravel_source_model',
      identity,
      contracts,
      relations: sourceModelReferenceIndexFromCatalog(catalog).graph,
    },
  };
}

import type { ModelAst, ControllerAst, ServiceAst, ProviderAst } from './ast';
import type { ControllerMethod } from './controller';
import { matchRequestValidationCapability } from './request';
import type { RouteDefinition } from './route';
import type { SourceSpan } from './provenance';
import type { SourceFile } from './names';
import { matchDiscovered, matchSourceDiscovery } from './collections';
import type { Sequence } from './collections';
import type { ModelReference, ResourceReference, RequestReference, ResponseReference, RouteReference, ChannelReference, ServiceReference, ControllerReference, SemanticRelationGraph } from './semanticReferences';
import { modelNameMatchesClassName } from './names';
import type { ResolvedServiceDependencies } from './service';
import type { ModelHighLevelContract, ProviderHighLevelContract, ResourceHighLevelContract, RequestHighLevelContract, ResponseHighLevelContract, RouteHighLevelContract, ServiceHighLevelContract, ServiceSemanticContract, ControllerActionHighLevelContract, ControllerActionFlowContract, LaravelSemanticContractCatalog } from './highLevelContracts';

import type { RequestFieldTarget } from './request';
import type { EndpointResponseBinding, EndpointRequestBinding } from './endpointBindings';
import type { RouteTarget } from './route';
import { relationEqual, relationExpand, relationFirstOption, relationFoldRight, relationOptionFold, relationProject, relationResolve } from '../../semantic/kernel/relationalSequence';

type RequestPropertyRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'request_property' }>;
type RouteResponseRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_response' }>;
type RouteControllerRelation = Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_controller' }>;

/**
 * Semantic projection knowledge. Syntax/control-flow variants are represented
 * as data dispatch tables; consumers interpret the resulting relations.
 */
const REQUEST_PROPERTY_RELATION_MODEL: Readonly<Record<RequestFieldTarget['kind'], (request: RequestReference, target: RequestFieldTarget) => readonly RequestPropertyRelation[]>> = Object.freeze({
  input_property: (request, target) => [{ kind: 'request_property', request, property: target.property }],
  input_collection: (request, target) => {
    const value = target as Extract<RequestFieldTarget, { readonly kind: 'input_collection' }>;
    return [
      { kind: 'request_property', request, property: value.property },
      { kind: 'request_property', request, property: value.element },
    ];
  },
});

const ROUTE_REQUEST_RELATION_MODEL: Readonly<Record<EndpointRequestBinding['kind'], (route: RouteReference, request: EndpointRequestBinding) => ReadonlyArray<Extract<import('./semanticReferences').SemanticRelation, { readonly kind: 'route_request' }>>>> = Object.freeze({
  form_request: (route, request) => [{ kind: 'route_request', route, request: (request as Extract<EndpointRequestBinding, { readonly kind: 'form_request' }>).request }],
  framework_request: () => [],
  inline_input: () => [],
  no_input: () => [],
});

const ROUTE_RESPONSE_RELATION_MODEL: Readonly<Record<EndpointResponseBinding['kind'], (route: RouteReference, response: EndpointResponseBinding) => readonly RouteResponseRelation[]>> = Object.freeze({
  declared_response: (route, response) => [{ kind: 'route_response', route, response: (response as Extract<EndpointResponseBinding, { readonly kind: 'declared_response' }>).response }],
  inline_response: () => [],
  redirect_response: () => [],
  file_response: () => [],
  empty_response: () => [],
});

const ROUTE_TARGET_RELATION_MODEL: Readonly<Record<RouteTarget['kind'], (route: RouteReference, target: RouteTarget) => readonly RouteControllerRelation[]>> = Object.freeze({
  controller_action: (route, target) => [{ kind: 'route_controller', route, controller: (target as Extract<RouteTarget, { readonly kind: 'controller_action' }>).controller }],
  controller_invokable: (route, target) => [{ kind: 'route_controller', route, controller: (target as Extract<RouteTarget, { readonly kind: 'controller_invokable' }>).controller }],
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

const CONTROLLER_METHOD_NODE_MODEL: Readonly<Record<ControllerMethod['kind'], (method: ControllerMethod) => readonly ControllerSemanticNode[]>> = Object.freeze({
  controller_helper: () => [],
  controller_action: method => {
    const value = method as Extract<ControllerMethod, { readonly kind: 'controller_action' }>;
    return [{
      kind: 'controller_semantic_node',
      identity: { kind: 'controller_reference', name: value.controller, action: value.action },
      action: value,
      source: value.source,
    }];
  },
});

const controllerNodesFromAst = (ast: ControllerAst): readonly ControllerSemanticNode[] =>
  relationExpand(sequenceToArray(ast.methods), method => CONTROLLER_METHOD_NODE_MODEL[method.kind](method));


const resourceNodeFromAst = (ast: import('./ast').ResourceAst): ResourceSemanticNode => ({
  kind: 'resource_semantic_node',
  identity: { kind: 'resource_reference', name: ast.definition.name },
  definition: ast.definition,
  source: ast.source,
});

const requestNodeFromAst = (ast: import('./ast').RequestAst): RequestSemanticNode => ({
  kind: 'request_semantic_node',
  identity: { kind: 'request_reference', name: ast.definition.identity.request },
  definition: ast.definition,
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

const responseNodeFromAst = (ast: import('./ast').ResponseAst): ResponseSemanticNode => ({
  kind: 'response_semantic_node',
  identity: { kind: 'response_reference', name: ast.definition.typeName },
  definition: ast.definition,
  source: ast.source,
});

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
    () => { const item = items as Extract<Sequence<T>, { readonly kind: 'cons' }>; return sequenceToArray(item.tail, Object.freeze([...output, item.head])); },
  );

const sequenceProject = <T, R>(items: Sequence<T>, project: (item: T) => R, output: readonly R[] = []): readonly R[] =>
  relationResolve(
    relationEqual(items.kind, 'empty'),
    () => output,
    () => { const item = items as Extract<Sequence<T>, { readonly kind: 'cons' }>; return sequenceProject(item.tail, project, Object.freeze([...output, project(item.head)])); },
  );

const sequenceExpand = <T, R>(items: Sequence<T>, expand: (item: T) => readonly R[], output: readonly R[] = []): readonly R[] =>
  relationResolve(
    relationEqual(items.kind, 'empty'),
    () => output,
    () => { const item = items as Extract<Sequence<T>, { readonly kind: 'cons' }>; return sequenceExpand(item.tail, expand, Object.freeze([...output, ...expand(item.head)])); },
  );

const sequenceFromArray = <T>(items: readonly T[], index = 0): Sequence<T> =>
  relationResolve(
    relationEqual(index, items.length),
    () => ({ kind: 'empty' as const }),
    () => ({ kind: 'cons' as const, head: items[index], tail: sequenceFromArray(items, index + 1) }),
  );

export function sourceModelReferenceIndexFromCatalog(catalog: SourceModelCatalog): SourceModelReferenceIndex {
  const relationValues = Object.freeze([
    ...sequenceExpand(catalog.controllers, controller => sequenceExpand(controller.action.semantic.resources, resource => [
      { kind: 'controller_resource' as const, controller: controller.identity, resource: resource.resource },
      { kind: 'controller_model' as const, controller: controller.identity, model: resource.model },
      { kind: 'controller_response' as const, controller: controller.identity, response: resource.response },
    ])),
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

export interface CompleteLaravelSourceModel {
  readonly kind: 'complete_laravel_source_model';
  readonly identity: SourceProjectIdentity;
  /**
   * Canonical upstream semantic boundary. AST/ADT catalog structures are
   * construction details and are intentionally not exposed to consumers.
   */
  readonly contracts: LaravelSemanticContractCatalog;
}

export interface CompleteSourceModelBuildResult
{ readonly kind: 'complete_source_model'; readonly value: CompleteLaravelSourceModel }

export function buildCompleteLaravelSourceModel(ast: import('./ast').CompleteSourceAst, identity: SourceProjectIdentity): CompleteSourceModelBuildResult {
  const source = ast.ast;
  const completeItems = <T>(discovery: import('./collections').SourceDiscovery<T>): Sequence<T> => matchSourceDiscovery(discovery, {
    notScanned: () => { throw Error('CompleteSourceAst invariant violated: source category was not scanned.'); },
    scanned: scanned => matchDiscovered(scanned.result, {
      empty: () => ({ kind: 'empty' }),
      many: value => value.items,
    }),
  });
  const controllers = completeItems(source.controllers.items);
  const providers = completeItems(source.providers.items);
  const models = completeItems(source.models.items);
  const resources = completeItems(source.resources.items);
  const requests = completeItems(source.requests.items);
  const responses = completeItems(source.responses.items);
  const services = completeItems(source.services.items);
  const routes = completeItems(source.routes.items);
  const channels = completeItems(source.channels.items);

  const catalog: SourceModelCatalog = {
    kind: 'source_model_catalog',
    providers: sequenceFromArray(sequenceProject(providers, provider => ({
      kind: 'provider_semantic_node' as const,
      identity: provider.definition.name,
      definition: provider.definition,
      source: provider.source,
    }))),
    controllers: sequenceFromArray(sequenceExpand(controllers, controllerNodesFromAst)),
    models: sequenceFromArray(sequenceProject(models, modelNodeFromAst)),
    resources: sequenceFromArray(sequenceProject(resources, resourceNodeFromAst)),
    requests: sequenceFromArray(sequenceProject(requests, requestNodeFromAst)),
    responses: sequenceFromArray(sequenceProject(responses, responseNodeFromAst)),
    services: sequenceFromArray(sequenceProject(services, service => {
      const base = serviceNodeFromAst(service);
      const resolved = sequenceExpand(service.definition.dependencies.items, fact => relationOptionFold(
        relationFirstOption(sequenceToArray(models), model => modelNameMatchesClassName(model.definition.identity.name, fact.target)),
        () => [],
        model => [{ kind: 'resolved_service_dependency' as const, fact, target: { kind: 'model_reference' as const, name: model.definition.identity.name } }],
      ));
      return {
        ...base,
        resolvedDependencies: { kind: 'resolved_service_dependencies', items: sequenceFromArray(resolved) },
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
    },
  };
}

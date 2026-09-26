import type { ModelAst, ControllerAst, ServiceAst } from './ast';
import type { ModelFacts } from './modelSourceFacts';
import type { ResourceFacts } from './resource';
import { matchRequestValidationCapability, type RequestFacts } from './request';
import type { ResponseFacts } from './response';
import type { RouteFacts } from './route';
import type { RouteEndpointContract } from './highLevelContracts';
import type { SourceSpan } from './provenance';
import type { SourceFile } from './names';
import { matchDiscovered, matchSourceDiscovery } from './collections';
import type { Sequence } from './collections';
import type { ModelReference, ResourceReference, RequestReference, ResponseReference, RouteReference, ChannelReference, ServiceReference, ControllerReference, SemanticRelationGraph } from './semanticReferences';
import { modelNameMatchesClassName } from './names';
import type { ResolvedServiceDependencies } from './service';

export type SourceProjectIdentity = {
  readonly kind: 'laravel_project';
  readonly root: SourceFile;
  readonly source: SourceSpan;
};

export type ModelSemanticNode = {
  readonly kind: 'model_semantic_node';
  readonly identity: ModelReference;
  readonly facts: ModelFacts;
  readonly source: SourceSpan;
};

export function modelSemanticNodeFromAst(ast: ModelAst): ModelSemanticNode {
  return {
    kind: 'model_semantic_node',
    identity: { kind: 'model_reference', name: ast.facts.identity.name },
    facts: ast.facts,
    source: ast.source
  };
}

export type ResourceSemanticNode = {
  readonly kind: 'resource_semantic_node';
  readonly identity: ResourceReference;
  readonly facts: ResourceFacts;
  readonly source: SourceSpan;
};

export type RequestSemanticNode = {
  readonly kind: 'request_semantic_node';
  readonly identity: RequestReference;
  readonly facts: RequestFacts;
  readonly source: SourceSpan;
};

export type ResponseSemanticNode = {
  readonly kind: 'response_semantic_node';
  readonly identity: ResponseReference;
  readonly facts: ResponseFacts;
  readonly source: SourceSpan;
};

export type ControllerSemanticNode = {
  readonly kind: 'controller_semantic_node';
  readonly identity: ControllerReference;
  readonly action: import('./controller').ControllerAction;
  readonly source: SourceSpan;
};

export type ServiceSemanticNode = {
  readonly kind: 'service_semantic_node';
  readonly identity: ServiceReference;
  readonly definition: import('./service').ServiceDefinition;
  readonly resolvedDependencies: ResolvedServiceDependencies;
  readonly source: SourceSpan;
};

export type ChannelSemanticNode = {
  readonly kind: 'channel_semantic_node';
  readonly identity: ChannelReference;
  readonly definition: import('./channel').ChannelDefinition;
  readonly source: SourceSpan;
};

export type RouteSemanticNode = {
  readonly kind: 'route_semantic_node';
  readonly identity: RouteReference;
  readonly facts: RouteFacts;
  readonly source: SourceSpan;
};

const modelNodeFromAst = (ast: ModelAst): ModelSemanticNode => modelSemanticNodeFromAst(ast);
const serviceNodeFromAst = (ast: ServiceAst): ServiceSemanticNode => ({
  kind: 'service_semantic_node',
  identity: { kind: 'service_reference', name: ast.definition.name },
  definition: ast.definition,
  resolvedDependencies: { kind: 'resolved_service_dependencies', items: { kind: 'empty' } },
  source: ast.source,
});

const controllerNodesFromAst = (ast: ControllerAst): readonly ControllerSemanticNode[] => {
  const nodes: ControllerSemanticNode[] = [];
  let methods = ast.methods;
  while (methods.kind === 'cons') {
    const method = methods.head;
    if (method.kind === 'controller_action') {
      nodes.push({
        kind: 'controller_semantic_node',
        identity: { kind: 'controller_reference', name: method.controller, action: method.action },
        action: method,
        source: method.source,
      });
    }Saya
    methods = methods.tail;
  }
  return nodes;
};


const resourceNodeFromAst = (ast: import('./ast').ResourceAst): ResourceSemanticNode => ({
  kind: 'resource_semantic_node',
  identity: { kind: 'resource_reference', name: ast.definition.name },
  facts: {
    kind: 'resource_facts',
    identity: { kind: 'resource_reference', name: ast.definition.name },
    model: ast.definition.model,
    response: ast.definition.response,
    fields: ast.definition.fields,
    assignments: ast.definition.assignments,
    sourceProperties: ast.definition.sourceProperties,
    actions: ast.definition.actions,
    endpoints: ast.definition.endpoints,
    synthetic: ast.definition.synthetic,
    source: ast.source,
  },
  source: ast.source,
});

const requestNodeFromAst = (ast: import('./ast').RequestAst): RequestSemanticNode => ({
  kind: 'request_semantic_node',
  identity: { kind: 'request_reference', name: ast.definition.identity.request },
  facts: {
    kind: 'request_facts',
    identity: ast.definition.identity,
    http: ast.definition.http,
    validation: ast.definition.validation,
    source: ast.source,
  },
  source: ast.source,
});

const routeNodeFromAst = (ast: import('./ast').RouteAst): RouteSemanticNode => {
  const definition = ast.definition;
  const endpoint: RouteEndpointContract = {
    kind: 'route_endpoint_contract',
    method: definition.method,
    path: definition.path,
    target: definition.target,
    parameters: definition.parameters,
    authentication: definition.auth,
    capability: definition.capability,
    middleware: definition.middleware,
    request: definition.request,
    response: { kind: 'declared_response', response: definition.response },
    returnSemantic: definition.returnSemantic,
    source: ast.source,
  };
  return {
    kind: 'route_semantic_node',
    identity: { kind: 'route_reference', name: definition.name },
    facts: {
      kind: 'route_facts',
      identity: { kind: 'route_reference', name: definition.name },
      domain: definition.domain,
      endpoint,
      response: definition.response,
      returnSemantic: definition.returnSemantic,
      source: ast.source,
    },
    source: ast.source,
  };
};

const responseNodeFromAst = (ast: import('./ast').ResponseAst): ResponseSemanticNode => ({
  kind: 'response_semantic_node',
  identity: { kind: 'response_reference', name: ast.definition.typeName },
  facts: {
    kind: 'response_facts',
    identity: { kind: 'response_reference', name: ast.definition.typeName },
    typeName: ast.definition.typeName,
    output: ast.definition.output,
    transport: ast.definition.transport,
    outcome: ast.definition.outcome,
    source: ast.source,
  },
  source: ast.source,
});

export type SourceModelCatalog = {
  readonly kind: 'source_model_catalog';
  readonly controllers: Sequence<ControllerSemanticNode>;
  readonly models: Sequence<ModelSemanticNode>;
  readonly resources: Sequence<ResourceSemanticNode>;
  readonly requests: Sequence<RequestSemanticNode>;
  readonly responses: Sequence<ResponseSemanticNode>;
  readonly services: Sequence<ServiceSemanticNode>;
  readonly routes: Sequence<RouteSemanticNode>;
  readonly channels: Sequence<ChannelSemanticNode>;
};

export type SourceModelReferenceIndex = {
  readonly kind: 'source_model_reference_index';
  readonly controllers: Sequence<ControllerReference>;
  readonly models: Sequence<ModelReference>;
  readonly resources: Sequence<ResourceReference>;
  readonly requests: Sequence<RequestReference>;
  readonly responses: Sequence<ResponseReference>;
  readonly routes: Sequence<RouteReference>;
  readonly graph: SemanticRelationGraph;
};

export function sourceModelReferenceIndexFromCatalog(catalog: SourceModelCatalog): SourceModelReferenceIndex {
  const collect = <I, T extends { readonly identity: I }>(items: Sequence<T>): Sequence<I> => {
    const values: I[] = [];
    let current = items;
    while (current.kind === 'cons') {
      values.push(current.head.identity);
      current = current.tail;
    }
    return values.reduceRight<Sequence<I>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
  };

  const relationValues: import('./semanticReferences').SemanticRelation[] = [];

  let controllers = catalog.controllers;
  while (controllers.kind === 'cons') {
    const controller = controllers.head;
    let resources = controller.action.semantic.resources;
    while (resources.kind === 'cons') {
      relationValues.push({ kind: 'controller_resource', controller: controller.identity, resource: resources.head.resource });
      relationValues.push({ kind: 'controller_model', controller: controller.identity, model: resources.head.model });
      relationValues.push({ kind: 'controller_response', controller: controller.identity, response: resources.head.response });
      resources = resources.tail;
    }
    controllers = controllers.tail;
  }

  let resources = catalog.resources;
  while (resources.kind === 'cons') {
    const resource = resources.head;
    relationValues.push({ kind: 'resource_model', resource: resource.identity, model: resource.facts.model });
    relationValues.push({ kind: 'response_resource', response: resource.facts.response, resource: resource.identity });
    resources = resources.tail;
  }

  let requests = catalog.requests;
  while (requests.kind === 'cons') {
    let fields = matchRequestValidationCapability(requests.head.facts.validation, {
      no_form_request_validation: () => ({ kind: 'empty' as const }),
      form_request_validation: value => value.schema.fields.items
    });
    while (fields.kind === 'cons') {
      const target = fields.head.target;
      if (target.kind === 'input_property') {
        relationValues.push({ kind: 'request_property', request: requests.head.identity, property: target.property });
      } else {
        relationValues.push({ kind: 'request_property', request: requests.head.identity, property: target.property });
        relationValues.push({ kind: 'request_property', request: requests.head.identity, property: target.element });
      }
      fields = fields.tail;
    }
    requests = requests.tail;
  }

  let routes = catalog.routes;
  while (routes.kind === 'cons') {
    const route = routes.head;
    const request = route.facts.endpoint.request;
    if (request.kind === 'form_request') {
      relationValues.push({ kind: 'route_request', route: route.identity, request: request.request });
    }
    relationValues.push({ kind: 'route_response', route: route.identity, response: route.facts.response });
    const target = route.facts.endpoint.target;
    if (target.kind === 'controller') {
      relationValues.push({ kind: 'route_controller', route: route.identity, controller: target.controller });
    }
    routes = routes.tail;
  }

  const relations = relationValues.reduceRight<Sequence<import('./semanticReferences').SemanticRelation>>(
    (tail, relation) => ({ kind: 'cons', head: relation, tail }),
    { kind: 'empty' },
  );

  return {
    kind: 'source_model_reference_index',
    controllers: collect<ControllerReference, ControllerSemanticNode>(catalog.controllers),
    models: collect<ModelReference, ModelSemanticNode>(catalog.models),
    resources: collect<ResourceReference, ResourceSemanticNode>(catalog.resources),
    requests: collect<RequestReference, RequestSemanticNode>(catalog.requests),
    responses: collect<ResponseReference, ResponseSemanticNode>(catalog.responses),
    routes: collect<RouteReference, RouteSemanticNode>(catalog.routes),
    graph: { kind: 'semantic_relation_graph', relations },
  };
}

export type CompleteLaravelSourceModel = {
  readonly kind: 'complete_laravel_source_model';
  readonly identity: SourceProjectIdentity;
  readonly catalog: SourceModelCatalog;
  readonly references: SourceModelReferenceIndex;
};

export type CompleteSourceModelBuildResult =
  { readonly kind: 'complete_source_model'; readonly value: CompleteLaravelSourceModel };

export function buildCompleteLaravelSourceModel(ast: import('./ast').CompleteSourceAst, identity: SourceProjectIdentity): CompleteSourceModelBuildResult {
  const source = ast.ast;
  const completeItems = <T>(discovery: import('./collections').SourceDiscovery<T>): Sequence<T> => matchSourceDiscovery(discovery, {
    notScanned: () => { throw new Error('CompleteSourceAst invariant violated: source category was not scanned.'); },
    scanned: scanned => matchDiscovered(scanned.result, {
      empty: () => ({ kind: 'empty' }),
      many: value => value.items,
    }),
  });
  const controllers = completeItems(source.controllers.items);
  const models = completeItems(source.models.items);
  const resources = completeItems(source.resources.items);
  const requests = completeItems(source.requests.items);
  const responses = completeItems(source.responses.items);
  const services = completeItems(source.services.items);
  const routes = completeItems(source.routes.items);
  const channels = completeItems(source.channels.items);

  const toSequence = <T, R>(items: Sequence<T>, map: (item: T) => R): Sequence<R> => {
    const values: R[] = [];
    let current = items;
    while (current.kind === 'cons') {
      values.push(map(current.head));
      current = current.tail;
    }
    return values.reduceRight<Sequence<R>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
  };
  const catalog: SourceModelCatalog = {
    kind: 'source_model_catalog',
    controllers: (() => {
      const nodes: ControllerSemanticNode[] = [];
      let items = controllers;
      while (items.kind === 'cons') {
        nodes.push(...controllerNodesFromAst(items.head));
        items = items.tail;
      }
      return nodes.reduceRight<Sequence<ControllerSemanticNode>>((tail, node) => ({ kind: 'cons', head: node, tail }), { kind: 'empty' });
    })(),
    models: toSequence(models, modelNodeFromAst),
    resources: toSequence(resources, resourceNodeFromAst),
    requests: toSequence(requests, requestNodeFromAst),
    responses: toSequence(responses, responseNodeFromAst),
    services: toSequence(services, service => {
      const base = serviceNodeFromAst(service);
      const resolved: import('./service').ResolvedServiceDependency[] = [];
      let facts = service.definition.dependencies.items;
      while (facts.kind === 'cons') {
        const fact = facts.head;
        let modelItems = models;
        while (modelItems.kind === 'cons') {
          if (modelNameMatchesClassName(modelItems.head.facts.identity.name, fact.target)) {
            resolved.push({
              kind: 'resolved_service_dependency',
              fact,
              target: { kind: 'model_reference', name: modelItems.head.facts.identity.name },
            });
            break;
          }
          modelItems = modelItems.tail;
        }
        facts = facts.tail;
      }
      return {
        ...base,
        resolvedDependencies: {
          kind: 'resolved_service_dependencies',
          items: resolved.reduceRight<Sequence<import('./service').ResolvedServiceDependency>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' }),
        },
      };
    }),
    routes: toSequence(routes, routeNodeFromAst),
    channels: toSequence(channels, astItem => ({
      kind: 'channel_semantic_node',
      identity: { kind: 'channel_reference', name: astItem.definition.name },
      definition: astItem.definition,
      source: astItem.source,
    })),
  };

  return {
    kind: 'complete_source_model',
    value: {
      kind: 'complete_laravel_source_model',
      identity,
      catalog,
      references: sourceModelReferenceIndexFromCatalog(catalog),
    },
  };
}

import type { ModelAst } from './ast';
import type { ModelFacts } from './modelSourceFacts';
import type { ResourceFacts } from './resource';
import type { RequestFacts } from './request';
import type { ResponseFacts } from './response';
import type { RouteFacts } from './route';
import type { SourceSpan } from './provenance';
import type { SourceFile } from './names';
import type { Sequence } from './collections';
import type { ModelReference, ResourceReference, RequestReference, ResponseReference, RouteReference, SemanticRelationGraph } from './semanticReferences';

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

export type RouteSemanticNode = {
  readonly kind: 'route_semantic_node';
  readonly identity: RouteReference;
  readonly facts: RouteFacts;
  readonly source: SourceSpan;
};

const modelNodeFromAst = (ast: ModelAst): ModelSemanticNode => modelSemanticNodeFromAst(ast);

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
  identity: { kind: 'request_reference', name: ast.definition.identity.requestClass },
  facts: {
    kind: 'request_facts',
    identity: ast.definition.identity,
    authorization: ast.definition.authorization,
    schema: ast.definition.schema,
    source: ast.source,
  },
  source: ast.source,
});

const responseNodeFromAst = (ast: import('./ast').ResponseAst): ResponseSemanticNode => ({
  kind: 'response_semantic_node',
  identity: { kind: 'response_reference', name: ast.definition.typeName },
  facts: {
    kind: 'response_facts',
    identity: ast.definition.identity,
    typeName: ast.definition.typeName,
    output: ast.definition.output,
    source: ast.source,
  },
  source: ast.source,
});

export type SourceModelCatalog = {
  readonly kind: 'source_model_catalog';
  readonly models: Sequence<ModelSemanticNode>;
  readonly resources: Sequence<ResourceSemanticNode>;
  readonly requests: Sequence<RequestSemanticNode>;
  readonly responses: Sequence<ResponseSemanticNode>;
  readonly routes: Sequence<RouteSemanticNode>;
};

export type SourceModelReferenceIndex = {
  readonly kind: 'source_model_reference_index';
  readonly models: Sequence<ModelReference>;
  readonly resources: Sequence<ResourceReference>;
  readonly requests: Sequence<RequestReference>;
  readonly responses: Sequence<ResponseReference>;
  readonly routes: Sequence<RouteReference>;
  readonly graph: SemanticRelationGraph;
};

export function sourceModelReferenceIndexFromCatalog(catalog: SourceModelCatalog): SourceModelReferenceIndex {
  const collect = <T extends { readonly identity: infer I }>(items: Sequence<T>): Sequence<I> => {
    const values: I[] = [];
    let current = items;
    while (current.kind === 'cons') {
      values.push(current.head.identity);
      current = current.tail;
    }
    return values.reduceRight<Sequence<I>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' });
  };

  return {
    kind: 'source_model_reference_index',
    models: collect(catalog.models),
    resources: collect(catalog.resources),
    requests: collect(catalog.requests),
    responses: collect(catalog.responses),
    routes: collect(catalog.routes),
    graph: { kind: 'semantic_relation_graph', relations: { kind: 'empty' } },
  };
}

export type CompleteLaravelSourceModel = {
  readonly kind: 'complete_laravel_source_model';
  readonly identity: SourceProjectIdentity;
  readonly catalog: SourceModelCatalog;
  readonly references: SourceModelReferenceIndex;
};

export type CompleteSourceModelBuildResult =
  | { readonly kind: 'complete_source_model'; readonly value: CompleteLaravelSourceModel }
  | { readonly kind: 'source_model_incomplete'; readonly missing: 'route_facts' };

export function buildCompleteLaravelSourceModel(ast: import('./ast').CompleteSourceAst, identity: SourceProjectIdentity): CompleteSourceModelBuildResult {
  const source = ast.ast;
  const models = source.models.items.result.kind === 'discovered_many'
    ? source.models.items.result.items
    : [];
  const resources = source.resources.items.result.kind === 'discovered_many'
    ? source.resources.items.result.items
    : [];
  const requests = source.requests.items.result.kind === 'discovered_many'
    ? source.requests.items.result.items
    : [];
  const responses = source.responses.items.result.kind === 'discovered_many'
    ? source.responses.items.result.items
    : [];
  const routes = source.routes.items.result.kind === 'discovered_many'
    ? source.routes.items.result.items
    : [];

  if (routes.length > 0) {
    return { kind: 'source_model_incomplete', missing: 'route_facts' };
  }

  const routeNodes: readonly RouteSemanticNode[] = [];
  const catalog: SourceModelCatalog = {
    kind: 'source_model_catalog',
    models: models.map(modelNodeFromAst).reduceRight<Sequence<ModelSemanticNode>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' }),
    resources: resources.map(resourceNodeFromAst).reduceRight<Sequence<ResourceSemanticNode>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' }),
    requests: requests.map(requestNodeFromAst).reduceRight<Sequence<RequestSemanticNode>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' }),
    responses: responses.map(responseNodeFromAst).reduceRight<Sequence<ResponseSemanticNode>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' }),
    routes: routeNodes.reduceRight<Sequence<RouteSemanticNode>>((tail, item) => ({ kind: 'cons', head: item, tail }), { kind: 'empty' }),
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

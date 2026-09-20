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

export type CompleteLaravelSourceModel = {
  readonly kind: 'complete_laravel_source_model';
  readonly identity: SourceProjectIdentity;
  readonly catalog: SourceModelCatalog;
  readonly references: SourceModelReferenceIndex;
};

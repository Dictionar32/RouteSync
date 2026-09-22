import type { SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceTraversalCardinality } from './resourceTraversalModel';
import { SemanticValueFactory } from './semanticValues';
import type { ResourceResolvedQueryOperation } from './resourceQueryOperation';
import type { MethodName, ModelName, PropertyName } from './semanticValues';
import type { ModelSemanticDefinition, ModelSemanticProperty } from './models';
import type { ResourceModelMethodMeaning, ResourceMethodMeaningDescriptor } from './resourceModelMethodMeaning';
import { knownMethodNames, meaningFor, resolveResourceMethodInvocation, resolveResourceModelMethod, resolveResourceQueryProjection } from './resourceModelMethodResolver';
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceTraversalTarget, ResourceTraversalCardinality } from './resourceTraversalModel';

export type ResourceQueryState =
  | { readonly kind: 'model_instance'; readonly model: ModelSemanticDefinition }
  | { readonly kind: 'query_builder'; readonly model: ModelSemanticDefinition };

export type ResourceModelMethodKind = ResourceModelMethodMeaning['kind'];

export interface ResourceModelMethodDescriptor extends ResourceMethodMeaningDescriptor {
  readonly kind: ResourceModelMethodKind;
}

export interface ResourceMethodSemanticOrigin {
  readonly receiver: ResourceQueryState;
  readonly method: MethodName;
  readonly meaning: ResourceModelMethodMeaning;
}

export type ResourceMethodTraversalProjection =
  | { readonly kind: 'query_builder'; readonly model: ModelSemanticDefinition; readonly semanticType: SemanticType; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality; readonly next: { readonly kind: 'query_builder'; readonly model: ModelSemanticDefinition } }
  | { readonly kind: 'single_model'; readonly model: ModelSemanticDefinition; readonly semanticType: SemanticType; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality; readonly next: { readonly kind: 'model_instance'; readonly model: ModelSemanticDefinition } }
  | { readonly kind: 'model_collection'; readonly model: ModelSemanticDefinition; readonly elementType: SemanticType; readonly semanticType: SemanticType; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality; readonly next: { readonly kind: 'model_instance'; readonly model: ModelSemanticDefinition } }
  | { readonly kind: 'paginated_collection'; readonly model: ModelSemanticDefinition; readonly elementType: SemanticType; readonly semanticType: SemanticType; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality; readonly next: { readonly kind: 'model_instance'; readonly model: ModelSemanticDefinition } }
  | { readonly kind: 'scalar'; readonly semanticType: SemanticType; readonly target: ResourceTraversalTarget; readonly cardinality: ResourceTraversalCardinality; readonly next: { readonly kind: 'retain' } }
  | { readonly kind: 'rejected'; readonly reason: 'value_collection' | 'unsupported' | 'unresolved' };

export interface ResourceMethodSemanticResultBase {
  readonly origin: ResourceMethodSemanticOrigin;
  readonly semanticType: SemanticType;
  readonly cardinality: ResourceTraversalCardinality;
  readonly traversal: ResourceMethodTraversalProjection;
}

export interface ResourceMethodUnresolvedOrigin {
  readonly kind: 'unresolved';
  readonly method: MethodName;
  readonly reason: 'receiver_model';
}

export interface ResourceMethodInvocation {
  readonly method: MethodName;
  readonly operation: ResourceResolvedQueryOperation;
  readonly meaning: ResourceModelMethodMeaning;
  readonly result: ResourceMethodResult;
}

export type ResourceQueryScalarProjection =
  | { readonly kind: 'property'; readonly property: PropertyName; readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>; readonly semanticType: SemanticType }
  | { readonly kind: 'aggregate'; readonly operation: 'sum' | 'avg' | 'min' | 'max'; readonly property: PropertyName; readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>; readonly inputType: SemanticType; readonly semanticType: SemanticType };

export type ResourceMethodResult =
  | (ResourceMethodSemanticResultBase & { readonly kind: 'query_builder'; readonly model: ModelSemanticDefinition })
  | (ResourceMethodSemanticResultBase & { readonly kind: 'single_model'; readonly model: ModelSemanticDefinition; readonly lookup: Extract<ResourceModelMethodMeaning, { readonly kind: 'single_model' }> })
  | (ResourceMethodSemanticResultBase & { readonly kind: 'model_collection'; readonly model: ModelSemanticDefinition; readonly elementType: SemanticType })
  | (ResourceMethodSemanticResultBase & { readonly kind: 'paginated_collection'; readonly model: ModelSemanticDefinition; readonly delivery: import('./resourceResponseSemantic').ResourcePaginationDelivery; readonly elementType: SemanticType })
  | (ResourceMethodSemanticResultBase & { readonly kind: 'scalar'; readonly operation: 'exists' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'value'; readonly projection: ResourceQueryScalarProjection | { readonly kind: 'none' } })
  | (ResourceMethodSemanticResultBase & { readonly kind: 'value_collection'; readonly element: ResourceMethodValueElement })
  | (ResourceMethodSemanticResultBase & { readonly kind: 'unsupported'; readonly method: MethodName });

export type ResourceMethodValueElement =
  | { readonly kind: 'property'; readonly property: PropertyName; readonly semantic: Extract<ModelSemanticProperty, { readonly kind: 'column' | 'accessor' }>; readonly semanticType: SemanticType }
  | { readonly kind: 'scalar'; readonly operation: 'exists' | 'count' | 'sum' | 'avg' | 'min' | 'max' | 'value'; readonly semanticType: SemanticType; readonly projection: ResourceQueryScalarProjection | { readonly kind: 'none' } };

export interface ResourceModelMethodSurface {
  readonly state: ResourceQueryState;
  readonly methods: readonly ResourceModelMethodDescriptor[];
}

export { meaningFor, resolveResourceMethodInvocation, resolveResourceModelMethod, resolveResourceQueryProjection };

export function classifyResourceModelMethod(method: MethodName): ResourceModelMethodKind { return meaningFor(method).kind; }

export function createResourceModelMethodSurface(model: ModelSemanticDefinition): ResourceModelMethodSurface {
  const methods = knownMethodNames().map(value => {
    const method = SemanticValueFactory.methodName(value);
    const meaning = meaningFor(method);
    return Object.freeze({ method, meaning, receiver: model, kind: meaning.kind });
  });
  return Object.freeze({ state: Object.freeze({ kind: 'model_instance', model }), methods: Object.freeze(methods) });
}

import type { ModelName, PropertyName, RelationName, MethodName, VariableName, ResourceName } from './semanticValues';
import type { ModelSemanticDefinition } from './models';
import type { ResourceExpressionModel } from './resourceExpressionModel';
import type { ResourceMethodResult } from './resourceModelMethodSurface';
import type { SemanticType } from '../../compiler/types/SemanticType';

export type ResourceTraversalCardinality =
  | { readonly kind: 'single' }
  | { readonly kind: 'collection' }
  | { readonly kind: 'paginated_collection' }
  | { readonly kind: 'query' };

export type ResourceTraversalAccess =
  | { readonly kind: 'direct' }
  | { readonly kind: 'nullsafe' };

export type ResourceTraversalRoot =
  | { readonly kind: 'model'; readonly model: ModelName }
  | { readonly kind: 'unresolved'; readonly reason: 'model' | 'property' | 'relation' | 'method' }
  | { readonly kind: 'variable'; readonly variable: VariableName }
  | { readonly kind: 'controller_this' }
  | { readonly kind: 'resource'; readonly resource: ResourceName };

export type ResourceTraversalModelReference =
  | { readonly kind: 'known'; readonly model: ModelSemanticDefinition }
  | { readonly kind: 'unresolved'; readonly reason: 'root_model' | 'receiver_model' };

export type ResourceTraversalStep =
  | {
      readonly kind: 'property';
      readonly sourceModel: ResourceTraversalModelReference;
      readonly property: PropertyName;
      readonly access: ResourceTraversalAccess;
      readonly target: ResourceTraversalTarget;
    }
  | {
      readonly kind: 'relation';
      readonly sourceModel: ResourceTraversalModelReference;
      readonly relation: RelationName;
      readonly access: ResourceTraversalAccess;
      readonly target: ResourceTraversalTarget;
      readonly cardinality: ResourceTraversalCardinality;
    }
  | {
      readonly kind: 'method';
      readonly sourceModel: ResourceTraversalModelReference;
      readonly method: MethodName;
      readonly arguments: readonly ResourceExpressionModel[];
      readonly access: ResourceTraversalAccess;
      readonly target: ResourceTraversalTarget;
      readonly cardinality: ResourceTraversalCardinality;
      readonly result: ResourceMethodResult;
    };

export type ResourceTraversalTarget =
  | { readonly kind: 'model'; readonly model: ModelSemanticDefinition; readonly semanticType: SemanticType }
  | { readonly kind: 'scalar'; readonly semanticType: SemanticType }
  | { readonly kind: 'collection'; readonly model: ModelSemanticDefinition; readonly elementType: SemanticType; readonly semanticType: SemanticType }
  | { readonly kind: 'query'; readonly model: ModelSemanticDefinition; readonly semanticType: SemanticType }
  | { readonly kind: 'resource'; readonly resource: ResourceName; readonly semanticType: SemanticType };

export interface ResourceTraversalResolvedStep {
  readonly step: ResourceTraversalStep;
  readonly sourceModel: ModelName;
  readonly target: ResourceTraversalTarget;
  readonly semanticType: SemanticType;
  readonly cardinality: ResourceTraversalCardinality;
}

export type ResourceTraversalResolution =
  | {
      readonly kind: 'resolved';
      readonly root: ResourceTraversalRoot;
      readonly steps: readonly ResourceTraversalResolvedStep[];
      readonly value: ResourceTraversalResolvedValue;
    }
  | {
      readonly kind: 'pending';
      readonly root: ResourceTraversalRoot;
      readonly steps: readonly ResourceTraversalStep[];
      readonly reason: 'root_model' | 'property' | 'relation' | 'method';
    }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_expression' | 'cyclic_definition' };

export interface ResourceTraversalResolvedValue {
  readonly target: ResourceTraversalTarget;
  readonly semanticType: SemanticType;
  readonly cardinality: ResourceTraversalCardinality;
}

export interface ResourceTraversalModel {
  readonly resolution: ResourceTraversalResolution;
}

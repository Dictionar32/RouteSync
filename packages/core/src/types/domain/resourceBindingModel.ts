import type { BoundCardinality, BoundNullability, BoundStepEdge } from './boundAst';
import type { ModelName, PropertyName, RelationName, MethodName, VariableName, ResourceName } from './semanticValues';
import type { ResourceBindingModelReference } from './resourceBindingModelReference';
import type { ResourceAccessMode, ResourceExpressionModel } from './resourceExpressionModel';
import type { ResourceBindingProvenance } from './resourceBindingProvenance';
import type { ResourceBindingOriginState } from './resourceBindingOrigin';
import type { ResourceTraversalModel } from './resourceTraversalModel';
import type { ResourceMethodResult } from './resourceModelMethodSurface';
import type { SemanticType } from '../../compiler/types/SemanticType';

export interface ResourceBindingStatementIdentity {
  readonly kind: 'statement_index';
  readonly value: number;
}

export interface ResourceBindingBranchPath {
  readonly kind: 'branch_path';
  readonly statements: readonly ResourceBindingStatementIdentity[];
}

export type ResourceBindingDefinitionIdentity =
  | { readonly kind: 'parameter'; readonly variable: VariableName }
  | { readonly kind: 'local_definition'; readonly statement: ResourceBindingStatementIdentity }
  | { readonly kind: 'branch_definition'; readonly statement: ResourceBindingStatementIdentity; readonly path: ResourceBindingBranchPath }
  | { readonly kind: 'loop_definition'; readonly statement: ResourceBindingStatementIdentity; readonly path: ResourceBindingBranchPath }
  | { readonly kind: 'catch_definition'; readonly statement: ResourceBindingStatementIdentity; readonly path: ResourceBindingBranchPath }
  | { readonly kind: 'external'; readonly variable: VariableName };

export type ResourceBindingDefinitionAvailability =
  | { readonly kind: 'definite' }
  | { readonly kind: 'branch_conditional'; readonly path: ResourceBindingBranchPath }
  | { readonly kind: 'loop_conditional'; readonly path: ResourceBindingBranchPath }
  | { readonly kind: 'catch_conditional'; readonly path: ResourceBindingBranchPath };

export interface ResourceBindingDefinitionModel {
  readonly identity: ResourceBindingDefinitionIdentity;
  readonly variable: VariableName;
  readonly expression: ResourceExpressionModel;
  readonly availability: ResourceBindingDefinitionAvailability;
}

export interface ResourceBindingDefinitionContext {
  readonly variable: VariableName;
  readonly definitions: readonly ResourceBindingDefinitionModel[];
}

export type ResourceBindingVariableOrigin =
  | { readonly kind: 'unresolved'; readonly variable: VariableName }
  | { readonly kind: 'resolved'; readonly variable: VariableName; readonly definitions: readonly ResourceBindingDefinitionModel[] };

export type ResourceBindingRoot =
  | { readonly kind: 'model'; readonly model: ResourceBindingModelReference }
  | { readonly kind: 'controller_this' }
  | { readonly kind: 'variable'; readonly variable: VariableName; readonly origin: ResourceBindingVariableOrigin }
  | { readonly kind: 'resource'; readonly resource: ResourceName };

export type ResourceBindingUnresolvedStep =
  | { readonly kind: 'member'; readonly property: PropertyName; readonly access: ResourceAccessMode }
  | { readonly kind: 'method'; readonly method: MethodName; readonly arguments: readonly ResourceExpressionModel[]; readonly access: ResourceAccessMode };

export type ResourceBindingResolvedStep =
  | { readonly kind: 'property'; readonly property: PropertyName; readonly access: ResourceAccessMode; readonly edge: BoundStepEdge }
  | { readonly kind: 'relation'; readonly relation: RelationName; readonly access: ResourceAccessMode; readonly edge: BoundStepEdge }
  | { readonly kind: 'method'; readonly method: MethodName; readonly arguments: readonly ResourceExpressionModel[]; readonly access: ResourceAccessMode; readonly edge: BoundStepEdge; readonly result: ResourceMethodResult };

export interface ResourceBindingPath {
  readonly root: ResourceBindingRoot;
  readonly steps: readonly ResourceBindingUnresolvedStep[];
  readonly origin: ResourceBindingOriginState;
}

export type ResourceBindingSemanticTarget =
  | { readonly kind: 'model'; readonly model: ResourceBindingModelReference }
  | { readonly kind: 'scalar' }
  | { readonly kind: 'resource'; readonly resource: ResourceName }
  | { readonly kind: 'query'; readonly model: ResourceBindingModelReference };

export interface ResourceBindingResolvedValue {
  readonly target: ResourceBindingSemanticTarget;
  readonly semanticType: SemanticType;
  readonly cardinality: BoundCardinality;
  readonly nullability: BoundNullability;
}

export type ResourceBindingResolution =
  | { readonly kind: 'resolved'; readonly path: ResourceBindingPath; readonly steps: readonly ResourceBindingResolvedStep[]; readonly value: ResourceBindingResolvedValue }
  | { readonly kind: 'pending'; readonly path: ResourceBindingPath }
  | { readonly kind: 'rejected'; readonly reason: 'unsupported_syntax' | 'unresolved_symbol' | 'unresolved_property' | 'unresolved_relation' | 'unresolved_method' };

export interface ResourceBindingModel {
  readonly source: ResourceExpressionModel;
  readonly resolution: ResourceBindingResolution;
  readonly provenance: ResourceBindingProvenance;
  readonly traversal: ResourceTraversalModel;
}

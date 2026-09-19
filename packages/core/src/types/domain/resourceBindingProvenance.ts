import type { ModelName, VariableName, ResourceName } from './semanticValues';
import type { ResourceExpressionModel } from './resourceExpressionModel';
import type { ResourceBindingDefinitionAvailability, ResourceBindingDefinitionIdentity } from './resourceBindingModel';

export type ResourceBindingOrigin =
  | { readonly kind: 'model'; readonly model: ModelName }
  | { readonly kind: 'resource'; readonly resource: ResourceName }
  | { readonly kind: 'controller_this' }
  | { readonly kind: 'variable'; readonly variable: VariableName }
  | { readonly kind: 'external_variable'; readonly variable: VariableName }
  | { readonly kind: 'expression'; readonly reason: 'non_variable_root' };

export interface ResourceBindingDefinitionTrace {
  readonly identity: ResourceBindingDefinitionIdentity;
  readonly variable: VariableName;
  readonly expression: ResourceExpressionModel;
  readonly availability: ResourceBindingDefinitionAvailability;
  readonly dependencies: readonly ResourceBindingProvenanceNode[];
}

export interface ResourceBindingProvenanceNode {
  readonly origin: ResourceBindingOrigin;
  readonly expression: ResourceExpressionModel;
  readonly definitions: readonly ResourceBindingDefinitionTrace[];
}

export type ResourceBindingProvenance =
  | { readonly kind: 'complete'; readonly roots: readonly ResourceBindingProvenanceNode[] }
  | { readonly kind: 'partial'; readonly roots: readonly ResourceBindingProvenanceNode[]; readonly missing: ResourceBindingOrigin }
  | { readonly kind: 'rejected'; readonly roots: readonly ResourceBindingProvenanceNode[]; readonly reason: 'cycle' | 'unsupported_expression' };

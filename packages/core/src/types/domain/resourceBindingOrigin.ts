import type { ModelName, ResourceName, VariableName } from './semanticValues';

export type ResourceBindingModelOrigin =
  | { readonly kind: 'controller_this' }
  | { readonly kind: 'model'; readonly model: ModelName }
  | { readonly kind: 'resource'; readonly resource: ResourceName }
  | { readonly kind: 'variable'; readonly variable: VariableName }
  | { readonly kind: 'unknown'; readonly reason: 'external_variable' | 'no_binding_origin' | 'unsupported_expression' };

export type ResourceBindingOriginState =
  | { readonly kind: 'known'; readonly origins: readonly ResourceBindingModelOrigin[] }
  | { readonly kind: 'unresolved'; readonly origin: ResourceBindingModelOrigin }
  | { readonly kind: 'rejected'; readonly reason: 'cyclic_definition' | 'unsupported_expression' };

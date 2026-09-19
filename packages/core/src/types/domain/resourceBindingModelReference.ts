import type { ModelSemanticDefinition } from './models';
import type { ModelName } from './semanticValues';

export type ResourceBindingModelReference =
  | { readonly kind: 'known'; readonly model: ModelSemanticDefinition }
  | { readonly kind: 'missing'; readonly name: ModelName };

export interface ResourceBindingModelCatalog {
  resolve(name: ModelName): ResourceBindingModelReference;
}

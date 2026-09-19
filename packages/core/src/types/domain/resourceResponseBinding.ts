import type { ModelName, ResourceName } from './semanticValues';
import type { ResourceBindingModel } from './resourceBindingModel';

export type ResourceResponseCollectionInput =
  | { readonly kind: 'model_collection'; readonly model: ModelName }
  | { readonly kind: 'paginated_collection'; readonly model: ModelName }
  | { readonly kind: 'single_model'; readonly model: ModelName };

export type ResourceResponseBinding =
  | {
      readonly kind: 'resource_collection';
      readonly resource: ResourceName;
      readonly input: ResourceResponseCollectionInput;
      readonly binding: ResourceBindingModel;
    }
  | {
      readonly kind: 'resource_single';
      readonly resource: ResourceName;
      readonly input: { readonly kind: 'single_model'; readonly model: ModelName };
      readonly binding: ResourceBindingModel;
    };

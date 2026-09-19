import type { BoundSemanticNode } from './boundAst';
import type { ModelName, PropertyName, ResponseFieldName } from './semanticValues';

export type ObjectPropertyOrigin =
  | {
      readonly kind: 'bound_expression';
      readonly bound: BoundSemanticNode;
    }
  | {
      readonly kind: 'model_column';
      readonly model: ModelName;
      readonly property: PropertyName;
    }
  | {
      readonly kind: 'model_accessor';
      readonly model: ModelName;
      readonly property: PropertyName;
    }
  | {
      readonly kind: 'model_relation';
      readonly model: ModelName;
      readonly property: PropertyName;
    }
  | {
      readonly kind: 'query_projection';
      readonly model: ModelName;
      readonly field: ResponseFieldName;
    }
  | {
      readonly kind: 'validation_field';
      readonly field: string;
    }
  | {
      readonly kind: 'derived';
      readonly reason: 'semantic_resolution' | 'nested_object';
    };

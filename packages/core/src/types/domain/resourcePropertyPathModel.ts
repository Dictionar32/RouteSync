import type { ModelSemanticProperty, ModelSemanticDefinition } from './models';
import type { ModelName, PropertyName, MethodName } from './semanticValues';
import type { ResourceAccessMode } from './resourceExpressionModel';
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { ResourceMethodResult } from './resourceModelMethodSurface';
import type { BoundCardinality } from './boundAst';

export type ResourcePropertyPathStep =
  | {
      readonly kind: 'property'; readonly sourceModel: ModelSemanticDefinition; readonly property: PropertyName;
      readonly access: ResourceAccessMode; readonly semantic: Extract<ModelSemanticProperty, { kind: 'column' | 'accessor' }>;
      readonly type: SemanticType; readonly cardinality: BoundCardinality;
    }
  | {
      readonly kind: 'relation'; readonly sourceModel: ModelSemanticDefinition; readonly property: PropertyName;
      readonly access: ResourceAccessMode; readonly semantic: Extract<ModelSemanticProperty, { kind: 'relation' }>;
      readonly type: SemanticType; readonly targetModel: ModelSemanticDefinition; readonly cardinality: BoundCardinality;
    }
  | {
      readonly kind: 'method'; readonly sourceModel: ModelSemanticDefinition; readonly method: MethodName;
      readonly access: ResourceAccessMode; readonly result: ResourceMethodResult; readonly type: SemanticType;
      readonly cardinality: BoundCardinality;
    };

export interface ResourcePropertyPathResolution {
  readonly kind: 'resolved';
  readonly rootModel: ModelSemanticDefinition;
  readonly steps: readonly ResourcePropertyPathStep[];
  readonly type: SemanticType;
}

export type ResourcePropertyPathResult =
  | ResourcePropertyPathResolution
  | { readonly kind: 'rejected'; readonly reason: 'missing_property' | 'non_terminal_scalar' | 'missing_target_model' };

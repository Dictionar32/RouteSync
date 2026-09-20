/**
 * resourceIrTypes.ts
 *
 * Resource domain IR interfaces and metadata specifications.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/resourceIrTypes
 */

import type { TypeProjections } from './typeIrTypes';
import type { TransformFunction } from './mapperIrTypes';
import type { DescriptionText, GeneratorName } from '../upstream/valueObjects';
import type { ValidationRules } from '../upstream/collections';
import type { SemanticType } from '../../compiler/types/SemanticType';
import type { CodeExpression, ControllerName, ModelName, PropertyName, ResourceId, ResourceName, RouteName, SourceFilePath } from './nominalVocabulary';

export type FieldSource =
    | { readonly type: 'computed'; readonly path: PropertyName }
    | { readonly type: 'model_column' | 'accessor' | 'method' | 'relation'; readonly path: PropertyName; readonly model: ModelName };

export interface ResourceFieldIR {
    readonly name: PropertyName;
    readonly transformedName: PropertyName;
    readonly type: TypeProjections;
    readonly transform: TransformFunction;
    readonly semanticType: SemanticType;
    readonly description: DescriptionText;
    readonly validation: ValidationRules;
    readonly source: FieldSource;
}

export interface ResourceAliasIR {
    readonly name: ResourceName;
    readonly kind: 'show' | 'index' | 'collection' | 'paginated';
    readonly target: ResourceName;
    readonly cardinality: 'single' | 'collection';
}

export interface VariantMetadata {
    readonly purpose: DescriptionText;
    readonly generator: GeneratorName;
    readonly nullability: 'strict' | 'loose';
    readonly optionality: 'strict' | 'loose';
}

export interface ResourceVariantIR {
    readonly kind: 'read' | 'schema' | 'contract' | 'form';
    readonly fields: readonly ResourceFieldIR[];
    readonly metadata: VariantMetadata;
}

export interface ResourceMetadata {
    readonly sourceFile: SourceFilePath;
    readonly controller: ControllerName;
    readonly routes: readonly RouteName[];
    readonly dependencies: readonly ResourceId[];
}

export interface ResourceIR {
    readonly id: ResourceId;
    readonly name: ResourceName;
    readonly sourceModel: ModelName;
    readonly fields: readonly ResourceFieldIR[];
    readonly aliases: readonly ResourceAliasIR[];
    readonly variants: readonly ResourceVariantIR[];
    readonly mapper: CodeExpression;
    readonly metadata: ResourceMetadata;
}

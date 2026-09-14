/**
 * mapperIrTypes.ts
 *
 * Mapper domain IR interfaces, field mappings, and transformation rules.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/mapperIrTypes
 */

export type TransformFunction =
    | 'date_iso'
    | 'date_human'
    | 'currency_minor'
    | 'currency_major'
    | 'enum_value'
    | 'custom';

export interface ConditionalRule {
    readonly condition: string;
    readonly parameters?: Record<string, unknown>;
    readonly parameterEntries?: readonly (readonly [string, unknown])[];
}

export interface MapperFieldIR {
    readonly source: string;
    readonly target: string;
    readonly transform?: TransformFunction;
    readonly conditional?: ConditionalRule;
}

export interface CustomTransformIR {
    readonly field: string;
    readonly function: string;
    readonly parameters?: readonly unknown[];
}

export interface TransformationRules {
    readonly dateFields: readonly string[];
    readonly currencyFields: readonly string[];
    readonly enumFields: readonly string[];
    readonly customTransforms: readonly CustomTransformIR[];
}

export interface MapperIR {
    readonly source: string;
    readonly target: string;
    readonly mappings: readonly MapperFieldIR[];
    readonly transformations: TransformationRules;
}

/**
 * resourceIrTypes.ts
 *
 * Resource domain IR interfaces and metadata specifications.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/resourceIrTypes
 */

import type { TypeProjections } from './typeIrTypes';
import type { ResolvedSemanticType } from './resolvedSemanticTypes';

export interface FieldSource {
    readonly type: 'model_column' | 'accessor' | 'method' | 'computed' | 'relation';
    readonly path: string;
    readonly model?: string;
}

export interface ResourceFieldIR {
    readonly name: string;
    readonly transformedName: string;
    readonly type: TypeProjections;
    readonly semanticType: ResolvedSemanticType;
    readonly description?: string;
    readonly validation?: unknown;
    readonly source?: FieldSource;
}

export interface ResourceAliasIR {
    readonly name: string;
    readonly kind: 'show' | 'index' | 'collection' | 'paginated';
    readonly target: string;
    readonly isArray?: boolean;
}

export interface VariantMetadata {
    readonly purpose: string;
    readonly generator: string;
    readonly nullable_handling?: 'strict' | 'loose';
    readonly optional_handling?: 'strict' | 'loose';
}

export interface ResourceVariantIR {
    readonly kind: 'read' | 'schema' | 'contract' | 'form';
    readonly fields: readonly ResourceFieldIR[];
    readonly metadata: VariantMetadata;
}

export interface ResourceMetadata {
    readonly sourceFile: string;
    readonly controller?: string;
    readonly routes?: readonly string[];
    readonly dependencies: readonly string[];
}

export interface ResourceIR {
    readonly id: string;
    readonly name: string;
    readonly sourceModel?: string;
    readonly fields: readonly ResourceFieldIR[];
    readonly aliases: readonly ResourceAliasIR[];
    readonly variants: readonly ResourceVariantIR[];
    readonly mapper: unknown;
    readonly metadata: ResourceMetadata;
}

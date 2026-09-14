/**
 * typeIrTypes.ts
 *
 * Core TypeIR representations and emitter projection contracts.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/typeIrTypes
 */

export interface PrimitiveTypeIR {
    readonly kind: 'primitive';
    readonly type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'unknown';
    readonly format?: string;
}

export interface ReferenceTypeIR {
    readonly kind: 'reference';
    readonly target: string;
    readonly module?: string;
}

export interface ArrayTypeIR {
    readonly kind: 'array';
    readonly items: TypeIR;
    readonly minItems?: number;
    readonly maxItems?: number;
}

export interface InlineObjectTypeIR {
    readonly kind: 'inline_object';
    readonly properties: Record<string, TypeIR>;
    readonly propertyEntries?: readonly (readonly [string, TypeIR])[];
    readonly additionalProperties?: boolean;
}

export interface NullableTypeIR {
    readonly kind: 'nullable';
    readonly inner: TypeIR;
}

export interface OptionalTypeIR {
    readonly kind: 'optional';
    readonly inner: TypeIR;
}

export interface UnionTypeIR {
    readonly kind: 'union';
    readonly types: readonly TypeIR[];
}

export interface LiteralTypeIR {
    readonly kind: 'literal';
    readonly value: string | number | boolean;
}

export type TypeIR =
    | PrimitiveTypeIR
    | ReferenceTypeIR
    | ArrayTypeIR
    | InlineObjectTypeIR
    | NullableTypeIR
    | OptionalTypeIR
    | UnionTypeIR
    | LiteralTypeIR;

export interface TypeProjections {
    readonly contract: TypeIR;
    readonly read: TypeIR;
    readonly form: TypeIR;
    readonly field: TypeIR;
    readonly mapper: TypeIR;
    readonly schema: TypeIR;
}

export interface EnhancedTypeIR {
    readonly kind: TypeIR['kind'];
    readonly _migration?: {
        readonly fromSemanticType?: string;
        readonly migrationDate?: string;
        readonly confidence: 'high' | 'medium' | 'low';
    };
    readonly _computed?: {
        readonly isNullable?: boolean;
        readonly isOptional?: boolean;
        readonly isArray?: boolean;
        readonly isReference?: boolean;
    };
    readonly [key: string]: unknown;
}

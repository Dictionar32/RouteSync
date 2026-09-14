/**
 * carriers.ts
 *
 * Intrinsic Domain Carriers and Schema Field Morphisms (Level 7 Architecture).
 * Replaces naked strings with typed semantic carriers.
 *
 * @module core/types/domain/schemaMorphism
 */

import { PrimitiveKind } from '../../../compiler/types/SemanticType';
import type { TypeWrapper } from './wrappers';

export const DomainCarrierKind = Object.freeze({
    Scalar: 'scalar',
    Model: 'model',
    Resource: 'resource',
    Structural: 'structural',
} as const);

export type DomainCarrierKind = typeof DomainCarrierKind[keyof typeof DomainCarrierKind];

export interface ScalarCarrier {
    readonly kind: typeof DomainCarrierKind.Scalar;
    readonly primitive: PrimitiveKind;
}

export interface ModelCarrier {
    readonly kind: typeof DomainCarrierKind.Model;
    readonly modelName: string;
    readonly primaryKeyType: PrimitiveKind;
}

export interface ResourceCarrier {
    readonly kind: typeof DomainCarrierKind.Resource;
    readonly resourceName: string;
}

export interface StructuralCarrier {
    readonly kind: typeof DomainCarrierKind.Structural;
    readonly entries: readonly SchemaFieldMorphism[];
}

export type DomainCarrier =
    | ScalarCarrier
    | ModelCarrier
    | ResourceCarrier
    | StructuralCarrier;

export interface SchemaFieldMorphism<C = DomainCarrier> {
    readonly key: string;
    readonly wrapper: TypeWrapper<C>;
    readonly description?: string;
}

export class DomainCarrierFactory {
    public static scalar(primitive: PrimitiveKind): ScalarCarrier {
        return Object.freeze({ kind: DomainCarrierKind.Scalar, primitive });
    }

    public static model(modelName: string, primaryKeyType: PrimitiveKind = PrimitiveKind.NUMBER): ModelCarrier {
        return Object.freeze({ kind: DomainCarrierKind.Model, modelName, primaryKeyType });
    }

    public static resource(resourceName: string): ResourceCarrier {
        return Object.freeze({ kind: DomainCarrierKind.Resource, resourceName });
    }

    public static structural(entries: readonly SchemaFieldMorphism[]): StructuralCarrier {
        return Object.freeze({ kind: DomainCarrierKind.Structural, entries: Object.freeze([...entries]) });
    }
}

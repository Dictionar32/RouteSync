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
import type { ModelName, ResourceName } from '../../../types/upstream/names';

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
    readonly modelName: ModelName;
    readonly primaryKeyType: PrimitiveKind;
}

export interface ResourceCarrier {
    readonly kind: typeof DomainCarrierKind.Resource;
    readonly resourceName: ResourceName;
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

    public static model(modelName: ModelName, primaryKeyType: PrimitiveKind = PrimitiveKind.NUMBER): ModelCarrier {
        return Object.freeze({ kind: DomainCarrierKind.Model, modelName, primaryKeyType });
    }

    public static resource(resourceName: ResourceName): ResourceCarrier {
        return Object.freeze({ kind: DomainCarrierKind.Resource, resourceName });
    }

    public static structural(entries: readonly SchemaFieldMorphism[]): StructuralCarrier {
        return Object.freeze({ kind: DomainCarrierKind.Structural, entries: Object.freeze([...entries]) });
    }
}

/**
 * resolvedSemanticTypes.ts
 *
 * Closed Discriminated Union ADT variants for ResolvedSemanticType.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/resolvedSemanticTypes
 */

import type { SemanticType } from '../semantic';

export interface BoundSemanticMetaContract {
    readonly isBound: true;
    readonly type: SemanticType;
    readonly model: string;
}

export interface UnboundSemanticMetaContract {
    readonly isBound: false;
}

export type ResolvedSemanticMetaContract = BoundSemanticMetaContract | UnboundSemanticMetaContract;

export type ResolvedSemanticMeta = {
    readonly type?: SemanticType;
    readonly model?: string;
};

export interface PrimitiveSemanticTypeIR {
    readonly kind: 'primitive';
    readonly type: SemanticType;
    readonly format: string | null;
    readonly resolved?: ResolvedSemanticMeta;
}

export interface ResourceSemanticTypeIR {
    readonly kind: 'resource';
    readonly resource: string;
    readonly collection: boolean;
    readonly resolved?: ResolvedSemanticMeta;
}

export interface ModelSemanticTypeIR {
    readonly kind: 'model';
    readonly model: string;
    readonly resolved?: ResolvedSemanticMeta;
}

export type SemanticPropertiesMap = Readonly<Record<string, ResolvedSemanticType>>;

export interface ObjectSemanticTypeIRContract {
    readonly kind: 'object';
    readonly propertyEntries: readonly (readonly [string, ResolvedSemanticType])[];
    readonly resolved: ResolvedSemanticMetaContract;
}

export type ObjectSemanticTypeIR = {
    readonly kind: 'object';
    readonly properties: SemanticPropertiesMap;
    readonly propertyEntries?: readonly (readonly [string, ResolvedSemanticType])[];
    readonly resolved?: ResolvedSemanticMeta;
};

export interface ArraySemanticTypeIR {
    readonly kind: 'array';
    readonly items: ResolvedSemanticType;
    readonly resolved?: ResolvedSemanticMeta;
}

export interface UnionSemanticTypeIR {
    readonly kind: 'union';
    readonly types: readonly ResolvedSemanticType[];
    readonly resolved?: ResolvedSemanticMeta;
}

export interface LiteralSemanticTypeIR {
    readonly kind: 'literal';
    readonly value: string | number | boolean;
    readonly resolved?: ResolvedSemanticMeta;
}

export type ResolvedSemanticType =
    | PrimitiveSemanticTypeIR
    | ResourceSemanticTypeIR
    | ModelSemanticTypeIR
    | ObjectSemanticTypeIR
    | ArraySemanticTypeIR
    | UnionSemanticTypeIR
    | LiteralSemanticTypeIR;

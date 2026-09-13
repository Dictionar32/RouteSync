/**
 * types.ts
 *
 * Types and Error definitions for ContractInputBoundary.
 *
 * @module compiler/compatibility/boundary
 */

import type { SemanticType } from '../../../types/semantic';

export interface LegacyPrimitiveValue {
    readonly kind: 'primitive';
    readonly type: SemanticType;
    readonly format?: string;
}

export interface LegacyResourceValue {
    readonly kind: 'resource';
    readonly resource: string;
    readonly collection: boolean;
}

export interface LegacyModelValue {
    readonly kind: 'model';
    readonly model: string;
}

export interface LegacyObjectValue {
    readonly kind: 'object';
    readonly properties: Readonly<Record<string, LegacyContractValue>>;
}

export interface LegacyArrayValue {
    readonly kind: 'array';
    readonly items: LegacyContractValue;
}

export interface LegacyUnionValue {
    readonly kind: 'union';
    readonly types: readonly LegacyContractValue[];
}

export interface LegacyLiteralValue {
    readonly kind: 'literal';
    readonly value: string | number | boolean;
}

export type LegacyContractValue =
    | LegacyPrimitiveValue
    | LegacyResourceValue
    | LegacyModelValue
    | LegacyObjectValue
    | LegacyArrayValue
    | LegacyUnionValue
    | LegacyLiteralValue;

export class ContractInputBoundaryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ContractInputBoundaryError';
    }
}

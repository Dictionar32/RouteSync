/**
 * sharedIrTypes.ts
 *
 * Shared Type IR, Enum IR, and Import IR contracts.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/sharedIrTypes
 */

import type { SemanticType } from '../semantic';

export interface TypeDefinitionContract {
    readonly fields: Readonly<Record<string, SemanticType>>;
    readonly fieldEntries?: readonly (readonly [string, SemanticType])[];
    readonly extends: readonly string[];
    readonly implements: readonly string[];
}

export type TypeDefinition = {
    fields?: Record<string, SemanticType>;
    fieldEntries?: readonly (readonly [string, SemanticType])[];
    extends?: string[];
    implements?: string[];
};

export interface SharedTypeIR {
    readonly name: string;
    readonly type: 'interface' | 'type' | 'class';
    readonly definition: TypeDefinition;
    readonly usedBy: readonly string[];
}

export interface EnumValueIR {
    readonly key: string;
    readonly value: string | number;
    readonly description?: string;
}

export interface EnumMetadata {
    readonly sourceFile: string;
    readonly usedBy: readonly string[];
    readonly generated_at: string;
}

export interface EnumIR {
    readonly name: string;
    readonly values: readonly EnumValueIR[];
    readonly type: 'string' | 'number';
    readonly metadata: EnumMetadata;
}

export interface ImportSpecIR {
    readonly name: string;
    readonly alias?: string;
    readonly isDefault?: boolean;
}

export interface ImportIR {
    readonly module: string;
    readonly imports: readonly ImportSpecIR[];
    readonly isTypeOnly: boolean;
}

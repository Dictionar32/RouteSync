/** Closed shared-type and import projections. */

import type { SemanticType } from '../semantic';

export type TypeDefinition = {
    readonly kind: 'interface' | 'type' | 'class';
    readonly fields: readonly {
        readonly name: string;
        readonly type: SemanticType;
    }[];
    readonly inheritance: readonly {
        readonly kind: 'extends' | 'implements';
        readonly target: string;
    }[];
};

export type TypeDefinitionContract = TypeDefinition;

export interface SharedTypeIR {
    readonly name: string;
    readonly definition: TypeDefinition;
    readonly usedBy: readonly string[];
}

export interface EnumValueIR {
    readonly key: string;
    readonly value: string | number;
    readonly description: string;
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

export type ImportBindingIR =
    | { readonly kind: 'named'; readonly name: string; readonly alias: string }
    | { readonly kind: 'default'; readonly name: string };

export interface ImportSpecIR {
    readonly binding: ImportBindingIR;
}

export interface ImportIR {
    readonly module: string;
    readonly imports: readonly ImportSpecIR[];
    readonly isTypeOnly: boolean;
}

/**
 * manifestIrTypes.ts
 *
 * Manifest shapes and parsed entities consumed during IR construction.
 * Conforms to Level 7 Subatomic Architecture & Rule 14 (<= 100 lines).
 *
 * @module core/types/ir/manifestIrTypes
 */

import type { SemanticType } from '../semantic';
import type { ResolvedSemanticType } from './resolvedSemanticTypes';

export type ParsedValidationMap = Readonly<Record<string, unknown>>;

export interface ParsedFieldContract {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly semanticType: SemanticType | ResolvedSemanticType;
    readonly format: string;
    readonly validationRules: readonly string[];
}

export type ParsedField = {
    name: string;
    type: string;
    nullable?: boolean;
    semanticType?: SemanticType | ResolvedSemanticType;
    format?: string;
    validationRules?: string[];
};

export interface ParsedActionContract {
    readonly name: string;
    readonly schema: ParsedValidationMap;
    readonly fields: readonly ParsedField[];
}

export type ParsedAction = {
    name: string;
    schema?: ParsedValidationMap;
    fields?: ParsedField[];
};

export interface ParsedResource {
    readonly name: string;
    readonly path: string;
    readonly fields: readonly ParsedField[];
    readonly model?: string;
}

export interface ParsedRequest {
    readonly name: string;
    readonly path: string;
    readonly actions: readonly ParsedAction[];
}

export interface ParsedRoute {
    readonly method: string;
    readonly path: string;
    readonly action: string;
    readonly controller: string;
    readonly name?: string;
    readonly middleware?: readonly string[];
}

export interface ManifestMetadata {
    readonly version: string;
    readonly scanned_at: string;
    readonly source_files: readonly string[];
}

export interface RouteManifest {
    readonly routes: readonly ParsedRoute[];
    readonly resources: readonly ParsedResource[];
    readonly requests: readonly ParsedRequest[];
    readonly metadata: ManifestMetadata;
}

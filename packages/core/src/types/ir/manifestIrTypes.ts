/**
 * Manifest shapes consumed by the legacy Contract IR builder.
 *
 * This vocabulary is intentionally distinct from `types/field.ts`:
 * `ManifestField` is already semantic manifest data, while `ParsedField`
 * is the syntax-oriented FieldNode vocabulary.
 */

import type { ResolvedSemanticType } from './resolvedSemanticTypes';

export type ParsedValidationMap = Readonly<Record<string, unknown>>;

export interface ManifestField {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly optional: boolean;
    readonly semanticType: ResolvedSemanticType;
    readonly format: string;
    readonly validationRules: readonly string[];
    readonly description: string;
    readonly validation: boolean;
}

export interface ManifestAction {
    readonly name: string;
    readonly schema: ParsedValidationMap;
    readonly fields: readonly ManifestField[];
    readonly validation: ParsedValidationMap;
}

export interface ParsedResource {
    readonly name: string;
    readonly sourceModel: string | undefined;
    readonly fields: readonly ManifestField[];
    readonly controller: string | undefined;
    readonly routes: readonly string[];
    readonly isSynthetic: boolean;
}

export interface ParsedRequest {
    readonly name: string;
    readonly actions: readonly ManifestAction[];
    readonly controller: string | undefined;
    readonly routes: readonly string[];
}

export interface ParsedRoute {
    readonly id: string;
    readonly method: string;
    readonly path: string;
    readonly action: string;
    readonly controller: string;
    readonly middleware: readonly string[];
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

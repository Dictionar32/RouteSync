/**
 * types.ts
 *
 * Core Scanner Types & Enums
 *
 * @module core/compiler/scanner/descriptors/types
 */

import type { SourceProjectIdentity } from "../../../types/upstream/highLevelSourceModel";

export const LaravelValidationType = Object.freeze({
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Array: "array",
    File: "file",
    Date: "date"
} as const);

export type LaravelValidationType = typeof LaravelValidationType[keyof typeof LaravelValidationType];

export interface LaravelValidationConstraint {
    readonly required: boolean;
    readonly nullable: boolean;
    readonly type: LaravelValidationType;
    readonly rules: readonly string[];
}

export type ResourceExpressionDescriptor =
    | { readonly kind: "resource"; readonly resource: string; readonly collection: boolean }
    | { readonly kind: "primitive"; readonly type: "string" | "int" | "boolean" }
    | { readonly kind: "raw"; readonly raw: string };

export interface StaticLaravelScannerOptions {
    readonly sourceProject: SourceProjectIdentity;
    readonly baseURL: string;
    readonly version: string;
}

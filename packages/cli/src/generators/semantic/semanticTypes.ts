/**
 * @file semanticTypes.ts
 * @description Core types and interfaces for the CompilerIR and semantic resolution
 *
 * @module cli/generators/semantic/semanticTypes
 */

import type { ActionType } from '../canonical-names';

export interface CompilerIR {
    readonly responseTypes: Map<string, ResolvedResponse>;
    readonly actionMappings: Record<string, ActionType>;
    readonly fieldMappings: Map<string, ResolvedField>;
    readonly resourceAliases: Map<string, string>;
    readonly responseCountByGroup: Map<string, number>;
    readonly resolvedRoutes: ResolvedRoute[];
    readonly metadata: {
        readonly computedAt: Date;
        readonly manifestHash: string;
        readonly totalRoutes: number;
        readonly totalModels: number;
        readonly totalResources: number;
        readonly errors: string[];
        readonly warnings: string[];
    };
}

export interface ResolvedResponse {
    readonly id: string;
    readonly kind: 'primitive' | 'resource' | 'model' | 'custom';
    readonly name: string;
    readonly contractName: string;
    readonly mapperName: string;
    readonly formMapperName: string;
    readonly fields: Map<string, ResolvedField>;
    readonly isCollection: boolean;
    readonly isPaginated: boolean;
    readonly isWrapped: boolean;
    readonly isNullable: boolean;
}

export interface ResolvedField {
    readonly name: string;
    readonly sourceSnakeCase: string;
    readonly type: 'string' | 'number' | 'boolean' | 'null' | 'unknown' | 'object' | 'array';
    readonly nullable: boolean;
    readonly zodType: string;
    readonly tsType: string;
    readonly sourceType: 'sql' | 'cast' | 'json' | 'unknown';
    readonly sourceValue: string;
}

export interface ResolvedRoute {
    readonly name: string;
    readonly action: ActionType;
    readonly responseId: string;
    readonly isCollection: boolean;
    readonly isPaginated: boolean;
    readonly isWrapped: boolean;
}

export interface NormalizedColumnInfo {
    readonly name: string;
    readonly type: string;
    readonly nullable: boolean;
}

export interface NormalizedModelInfo {
    readonly name: string;
    readonly columns: readonly NormalizedColumnInfo[];
    readonly columnsByName: Map<string, NormalizedColumnInfo>;
    readonly casts: Map<string, string>;
}

export interface FieldResolutionMeta {
    readonly type: string;
    readonly cast: string | undefined;
    readonly nullable: boolean;
}

export function toFieldResolutionMeta(raw: {
    readonly type?: string;
    readonly cast?: string;
    readonly nullable?: boolean;
}): FieldResolutionMeta {
    const type = typeof raw.type === 'string' && raw.type.length > 0 ? raw.type : 'unknown';
    const cast = typeof raw.cast === 'string' && raw.cast.length > 0 ? raw.cast : undefined;
    const nullable = raw.nullable === true;
    return Object.freeze({ type, cast, nullable });
}

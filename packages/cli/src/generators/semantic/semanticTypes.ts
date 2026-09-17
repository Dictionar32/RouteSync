/** Closed compiler vocabulary. Semantic meaning is carried, never reconstructed. */
import type { ActionType } from '../canonical-names';
import type { ResolvedSemanticType } from '@routesync/core';

export type ResponseCardinality =
    | { readonly kind: 'single' }
    | { readonly kind: 'collection' }
    | { readonly kind: 'paginated_collection' };

export type ResponseEnvelope =
    | { readonly kind: 'direct' }
    | { readonly kind: 'wrapped' };

export type ResponseNullability =
    | { readonly kind: 'non_nullable' }
    | { readonly kind: 'nullable' };

export type ResponseKind = 'primitive' | 'resource' | 'model' | 'custom';

export type FieldOrigin =
    | { readonly kind: 'resource_expression'; readonly expressionKind: string }
    | { readonly kind: 'model_column'; readonly columnName: string };

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
    readonly kind: ResponseKind;
    readonly name: string;
    readonly contractName: string;
    readonly mapperName: string;
    readonly formMapperName: string;
    readonly fields: Map<string, ResolvedField>;
    readonly cardinality: ResponseCardinality;
    readonly envelope: ResponseEnvelope;
    readonly nullability: ResponseNullability;
}

export interface ResolvedField {
    readonly name: string;
    readonly sourceName: string;
    readonly semanticType: ResolvedSemanticType;
    readonly zodType: string;
    readonly tsType: string;
    readonly origin: FieldOrigin;
}

export interface ResolvedRoute {
    readonly name: string;
    readonly action: ActionType;
    readonly responseId: string;
    readonly cardinality: ResponseCardinality;
    readonly envelope: ResponseEnvelope;
}

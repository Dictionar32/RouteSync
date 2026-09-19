/** Closed semantic property binding emitted by the model origin boundary. */
import type { SemanticType } from '../../../types/SemanticType';
import type { ModelSemanticProperty } from '../../../../types/domain/models';

export interface ResolvedColumnBinding {
    readonly kind: 'column';
    readonly propertyName: string;
    readonly source: Extract<ModelSemanticProperty, { readonly kind: 'column' }>;
    readonly semanticType: SemanticType;
}

export interface ResolvedAccessorBinding {
    readonly kind: 'accessor';
    readonly propertyName: string;
    readonly source: Extract<ModelSemanticProperty, { readonly kind: 'accessor' }>;
    readonly semanticType: SemanticType;
}

export interface ResolvedRelationBinding {
    readonly kind: 'relation';
    readonly propertyName: string;
    readonly source: Extract<ModelSemanticProperty, { readonly kind: 'relation' }>;
    readonly semanticType: SemanticType;
}

export type ResolvedPropertyBinding = ResolvedColumnBinding | ResolvedAccessorBinding | ResolvedRelationBinding;

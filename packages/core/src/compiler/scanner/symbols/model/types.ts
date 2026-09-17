/**
 * Closed semantic property binding emitted by the model origin boundary.
 * Consumers receive the resolved SemanticType and never reconstruct it.
 */
import type { SemanticType } from '../../../types/SemanticType';
import type { ParsedColumn, } from '../../../../types/domain/databaseColumns';
import type { ParsedAccessor, ParsedRelation } from '../../../../types/domain/eloquentTypes';

export interface ResolvedColumnBinding {
    readonly kind: 'column';
    readonly propertyName: string;
    readonly source: ParsedColumn;
    readonly semanticType: SemanticType;
}

export interface ResolvedAccessorBinding {
    readonly kind: 'accessor';
    readonly propertyName: string;
    readonly source: ParsedAccessor;
    readonly semanticType: SemanticType;
}

export interface ResolvedRelationBinding {
    readonly kind: 'relation';
    readonly propertyName: string;
    readonly source: ParsedRelation;
    readonly semanticType: SemanticType;
}

export type ResolvedPropertyBinding =
    | ResolvedColumnBinding
    | ResolvedAccessorBinding
    | ResolvedRelationBinding;

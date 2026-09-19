import type { EloquentRelationType, EloquentRelationCardinality } from '../../../../../types/route';
import type { ModelName } from '../../../../../types/domain/semanticValues';
import type { SemanticType } from '../../../../../../types/SemanticType';

export type RelationForeignKey =
    | { readonly kind: 'convention' }
    | { readonly kind: 'explicit'; readonly column: string };

export interface ScannedModelRelationParams {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel: string;
    readonly cardinality: EloquentRelationCardinality;
    readonly multiplicity: { readonly kind: 'single' } | { readonly kind: 'collection' };
    readonly semanticType: SemanticType;
    readonly targetShape: { readonly kind: 'single'; readonly model: ModelName } | { readonly kind: 'collection'; readonly model: ModelName };
    readonly traversalTarget: { readonly kind: 'model'; readonly model: ModelName } | { readonly kind: 'collection'; readonly model: ModelName };
    readonly foreignKey: RelationForeignKey;
}

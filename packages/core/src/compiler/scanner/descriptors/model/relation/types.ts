import type { EloquentRelationType, EloquentRelationCardinality } from '../../../../../types/route';

export type RelationForeignKey =
    | { readonly kind: 'convention' }
    | { readonly kind: 'explicit'; readonly column: string };

export interface ScannedModelRelationParams {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel: string;
    readonly cardinality: EloquentRelationCardinality;
    readonly foreignKey: RelationForeignKey;
}

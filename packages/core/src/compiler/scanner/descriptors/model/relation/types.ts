/**
 * types.ts
 *
 * Eloquent model relation descriptor types.
 *
 * @module core/compiler/scanner/descriptors/model/relation
 */

import type {
    EloquentRelationType,
    EloquentRelationCardinality
} from '../../../../../types/route';

export interface ScannedModelRelationParams {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel: string;
    readonly cardinality: EloquentRelationCardinality;
    readonly foreignKey: string | null;
}

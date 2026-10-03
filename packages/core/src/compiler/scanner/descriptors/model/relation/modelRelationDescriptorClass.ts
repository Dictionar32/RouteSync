/**
 * modelRelationDescriptorClass.ts
 *
 * ScannedModelRelationDescriptor class implementation.
 *
 * @module core/compiler/scanner/descriptors/model/relation
 */

import type {
    ModelRelationDescriptor,
    SingleRelationDescriptor,
    CollectionRelationDescriptor,
    EloquentRelationCardinality
} from '../../../../../types/route';
import { EloquentRelationType } from '../../../../../types/route';
import { SemanticValueFactory, type RelationName, type ModelName, type ColumnName } from '../../../../../types/domain/semanticValues';

import type { SemanticType } from '../../../../types/SemanticType';
import type { ScannedModelRelationParams } from './types';
import {
    computeRelationParams,
    computeSingleRelationParams,
    computeCollectionRelationParams,
    computeNoneRelationParams
} from './relationFactories';

/**
 * Reusable Constructor: Scanned Model Relation Descriptor.
 */
export interface ScannedModelRelationDescriptor extends ModelRelationDescriptor {
    readonly name: RelationName;
    readonly type: EloquentRelationType;
    readonly sourceModel: ModelName;
    readonly targetModel: ModelName;
    readonly cardinality: EloquentRelationCardinality;
    readonly multiplicity: ScannedModelRelationParams['multiplicity'];
    readonly semanticType: SemanticType;
    readonly targetShape: ScannedModelRelationParams['targetShape'];
    readonly traversalTarget: ScannedModelRelationParams['traversalTarget'];
    readonly foreignKey: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
}

const relationDescriptor = <T extends EloquentRelationCardinality>(
    params: ScannedModelRelationParams & { readonly cardinality: T },
): ScannedModelRelationDescriptor & { readonly cardinality: T } => Object.freeze({
    name: params.name,
    type: params.type,
    sourceModel: params.modelName,
    targetModel: params.targetModel,
    cardinality: params.cardinality,
    multiplicity: params.multiplicity,
    semanticType: params.semanticType,
    targetShape: params.targetShape,
    traversalTarget: params.traversalTarget,
    foreignKey: params.foreignKey,
});

export const ScannedModelRelationDescriptor = Object.freeze({
    create: (params: {
        readonly name: RelationName;
        readonly type: EloquentRelationType;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly cardinality: EloquentRelationCardinality;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): ScannedModelRelationDescriptor => relationDescriptor(computeRelationParams(params)),
    single: (params: {
        readonly name: RelationName;
        readonly type: EloquentRelationType;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): SingleRelationDescriptor => relationDescriptor(computeSingleRelationParams(params)),
    collection: (params: {
        readonly name: RelationName;
        readonly type: EloquentRelationType;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): CollectionRelationDescriptor => relationDescriptor(computeCollectionRelationParams(params)),
    none: (): ScannedModelRelationDescriptor => relationDescriptor(computeNoneRelationParams()),
    belongsTo: (params: {
        readonly name: RelationName;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): SingleRelationDescriptor => ScannedModelRelationDescriptor.single({ ...params, type: EloquentRelationType.BelongsTo }),
    hasMany: (params: {
        readonly name: RelationName;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): CollectionRelationDescriptor => ScannedModelRelationDescriptor.collection({ ...params, type: EloquentRelationType.HasMany })
});

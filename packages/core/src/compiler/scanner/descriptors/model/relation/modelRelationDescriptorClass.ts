/**
 * modelRelationDescriptorClass.ts
 *
 * ScannedModelRelationDescriptor class implementation.
 *
 * @module core/compiler/scanner/descriptors/model/relation
 */

import type {
    ParsedRelation,
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
export class ScannedModelRelationDescriptor implements ParsedRelation {
    public readonly name: RelationName;
    public readonly type: EloquentRelationType;
    public readonly sourceModel: ModelName;
    public readonly targetModel: ModelName;
    public readonly cardinality: EloquentRelationCardinality;
    public readonly multiplicity: ScannedModelRelationParams['multiplicity'];
    public readonly semanticType: SemanticType;
    public readonly targetShape: ScannedModelRelationParams['targetShape'];
    public readonly traversalTarget: ScannedModelRelationParams['traversalTarget'];
    public readonly foreignKey: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };

    constructor(params: ScannedModelRelationParams) {
        this.name = params.name;
        this.type = params.type;
        this.sourceModel = params.modelName;
        this.targetModel = params.targetModel;
        this.cardinality = params.cardinality;
        this.multiplicity = params.multiplicity;
        this.semanticType = params.semanticType;
        this.targetShape = params.targetShape;
        this.traversalTarget = params.traversalTarget;
        this.foreignKey = params.foreignKey.kind === 'convention' ? { kind: 'convention' } : { kind: 'explicit', column: params.foreignKey.column };
        Object.freeze(this);
    }

    public static create(params: {
        readonly name: RelationName;
        readonly type: EloquentRelationType;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly cardinality: EloquentRelationCardinality;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): ScannedModelRelationDescriptor {
        return new ScannedModelRelationDescriptor(computeRelationParams(params));
    }

    public static single(params: {
        readonly name: RelationName;
        readonly type: EloquentRelationType;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): SingleRelationDescriptor {
        return new ScannedModelRelationDescriptor(
            computeSingleRelationParams(params)
        ) as SingleRelationDescriptor;
    }

    public static collection(params: {
        readonly name: RelationName;
        readonly type: EloquentRelationType;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): CollectionRelationDescriptor {
        return new ScannedModelRelationDescriptor(
            computeCollectionRelationParams(params)
        ) as CollectionRelationDescriptor;
    }

    public static none(): ScannedModelRelationDescriptor {
        return new ScannedModelRelationDescriptor(computeNoneRelationParams());
    }

    public static belongsTo(params: {
        readonly name: RelationName;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): SingleRelationDescriptor {
        return ScannedModelRelationDescriptor.single({
            ...params,
            type: EloquentRelationType.BelongsTo
        });
    }

    public static hasMany(params: {
        readonly name: RelationName;
        readonly modelName: ModelName;
        readonly targetModel?: ModelName;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: ColumnName };
    }): CollectionRelationDescriptor {
        return ScannedModelRelationDescriptor.collection({
            ...params,
            type: EloquentRelationType.HasMany
        });
    }
}

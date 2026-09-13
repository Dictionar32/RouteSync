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
    public readonly name: string;
    public readonly type: EloquentRelationType;
    public readonly modelName: string;
    public readonly targetModel: string;
    public readonly cardinality: EloquentRelationCardinality;
    public readonly isCollection: boolean;
    public readonly foreignKey: string | null;

    constructor(params: ScannedModelRelationParams) {
        this.name = params.name;
        this.type = params.type;
        this.modelName = params.modelName;
        this.targetModel = params.targetModel;
        this.cardinality = params.cardinality;
        this.isCollection = params.isCollection;
        this.foreignKey = params.foreignKey;
        Object.freeze(this);
    }

    public static create(params: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly cardinality?: EloquentRelationCardinality;
        readonly isCollection?: boolean;
        readonly foreignKey?: string | null;
    }): ScannedModelRelationDescriptor {
        return new ScannedModelRelationDescriptor(computeRelationParams(params));
    }

    public static single(params: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly foreignKey?: string | null;
    }): SingleRelationDescriptor {
        return new ScannedModelRelationDescriptor(
            computeSingleRelationParams(params)
        ) as SingleRelationDescriptor;
    }

    public static collection(params: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly foreignKey?: string | null;
    }): CollectionRelationDescriptor {
        return new ScannedModelRelationDescriptor(
            computeCollectionRelationParams(params)
        ) as CollectionRelationDescriptor;
    }

    public static none(): ScannedModelRelationDescriptor {
        return new ScannedModelRelationDescriptor(computeNoneRelationParams());
    }

    public static belongsTo(params: {
        readonly name: string;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly foreignKey?: string | null;
    }): SingleRelationDescriptor {
        return ScannedModelRelationDescriptor.single({
            ...params,
            type: EloquentRelationType.BelongsTo
        });
    }

    public static hasMany(params: {
        readonly name: string;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly foreignKey?: string | null;
    }): CollectionRelationDescriptor {
        return ScannedModelRelationDescriptor.collection({
            ...params,
            type: EloquentRelationType.HasMany
        });
    }
}

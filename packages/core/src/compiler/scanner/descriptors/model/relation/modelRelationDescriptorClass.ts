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
        this.name = SemanticValueFactory.relationName(params.name);
        this.type = params.type;
        this.sourceModel = SemanticValueFactory.modelName(params.modelName);
        this.targetModel = SemanticValueFactory.modelName(params.targetModel);
        this.cardinality = params.cardinality;
        this.multiplicity = params.multiplicity;
        this.semanticType = params.semanticType;
        this.targetShape = params.targetShape;
        this.traversalTarget = params.traversalTarget;
        this.foreignKey = params.foreignKey.kind === 'convention' ? { kind: 'convention' } : { kind: 'explicit', column: SemanticValueFactory.columnName(params.foreignKey.column) };
        Object.freeze(this);
    }

    public static create(params: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly cardinality: EloquentRelationCardinality;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
    }): ScannedModelRelationDescriptor {
        return new ScannedModelRelationDescriptor(computeRelationParams(params));
    }

    public static single(params: {
        readonly name: string;
        readonly type: EloquentRelationType;
        readonly modelName: string;
        readonly targetModel?: string;
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
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
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
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
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
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
        readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
    }): CollectionRelationDescriptor {
        return ScannedModelRelationDescriptor.collection({
            ...params,
            type: EloquentRelationType.HasMany
        });
    }
}

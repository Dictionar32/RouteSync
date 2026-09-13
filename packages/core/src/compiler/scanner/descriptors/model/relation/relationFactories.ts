/**
 * relationFactories.ts
 *
 * Relation parameter computation and factory helper functions.
 *
 * @module compiler/scanner/descriptors/model/relation
 */

import type {
    EloquentRelationCardinality
} from '../../../../../types/route';
import { EloquentRelationType, EloquentRelationClassifier } from '../../../../../types/route';
import type { ScannedModelRelationParams } from './types';

export function computeRelationParams({
    name,
    type,
    modelName,
    targetModel = modelName,
    cardinality,
    isCollection,
    foreignKey = null
}: {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel?: string;
    readonly cardinality?: EloquentRelationCardinality;
    readonly isCollection?: boolean;
    readonly foreignKey?: string | null;
}): ScannedModelRelationParams {
    const desc = EloquentRelationClassifier.getDescriptor(type);
    return {
        name,
        type,
        modelName,
        targetModel,
        cardinality: cardinality ?? desc.cardinality,
        isCollection: isCollection ?? desc.isCollection,
        foreignKey
    };
}

export function computeSingleRelationParams({
    name,
    type,
    modelName,
    targetModel = modelName,
    foreignKey = null
}: {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel?: string;
    readonly foreignKey?: string | null;
}): ScannedModelRelationParams {
    return {
        name,
        type,
        modelName,
        targetModel,
        cardinality: "one",
        isCollection: false,
        foreignKey
    };
}

export function computeCollectionRelationParams({
    name,
    type,
    modelName,
    targetModel = modelName,
    foreignKey = null
}: {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel?: string;
    readonly foreignKey?: string | null;
}): ScannedModelRelationParams {
    return {
        name,
        type,
        modelName,
        targetModel,
        cardinality: "many",
        isCollection: true,
        foreignKey
    };
}

export function computeNoneRelationParams(): ScannedModelRelationParams {
    return {
        name: "none",
        type: EloquentRelationType.HasOne,
        modelName: "",
        targetModel: "",
        cardinality: "one",
        isCollection: false,
        foreignKey: null
    };
}

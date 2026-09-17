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
    foreignKey = { kind: 'convention' as const }
}: {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel?: string;
    readonly cardinality?: EloquentRelationCardinality;
    readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
}): ScannedModelRelationParams {
    const desc = EloquentRelationClassifier.getDescriptor(type);
    return {
        name,
        type,
        modelName,
        targetModel,
        cardinality: cardinality ?? desc.cardinality,
        foreignKey
    };
}

export function computeSingleRelationParams({
    name,
    type,
    modelName,
    targetModel = modelName,
    foreignKey = { kind: 'convention' as const }
}: {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel?: string;
    readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
}): ScannedModelRelationParams {
    return {
        name,
        type,
        modelName,
        targetModel,
        cardinality: "one",
        foreignKey
    };
}

export function computeCollectionRelationParams({
    name,
    type,
    modelName,
    targetModel = modelName,
    foreignKey = { kind: 'convention' as const }
}: {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel?: string;
    readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
}): ScannedModelRelationParams {
    return {
        name,
        type,
        modelName,
        targetModel,
        cardinality: "many",
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
        foreignKey: { kind: 'convention' }
    };
}

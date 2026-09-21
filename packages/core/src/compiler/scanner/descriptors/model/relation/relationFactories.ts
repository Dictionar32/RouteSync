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
import { ReadonlyCollectionType, CollectionKind, ReferenceType } from '../../../../types/SemanticType';
import { SemanticValueFactory } from '../../../../../types/domain/semanticValues';
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
    readonly cardinality: EloquentRelationCardinality;
    readonly foreignKey?: { readonly kind: 'convention' } | { readonly kind: 'explicit'; readonly column: string };
}): ScannedModelRelationParams {
    const desc = EloquentRelationClassifier.getDescriptor(type);
    const resolvedCardinality = cardinality;
    const target = ReferenceType.model('', targetModel);
    const targetShape = resolvedCardinality === 'many'
        ? { kind: 'collection' as const, model: SemanticValueFactory.modelName(targetModel) }
        : { kind: 'single' as const, model: SemanticValueFactory.modelName(targetModel) };
    const semanticType = resolvedCardinality === 'many'
        ? new ReadonlyCollectionType(CollectionKind.COLLECTION, target)
        : target;
    return {
        name,
        type,
        modelName,
        targetModel,
        cardinality: resolvedCardinality,
        multiplicity: resolvedCardinality === 'many' ? { kind: 'collection' as const } : { kind: 'single' as const },
        semanticType,
        targetShape,
        traversalTarget: resolvedCardinality === 'many'
            ? { kind: 'collection' as const, model: SemanticValueFactory.modelName(targetModel) }
            : { kind: 'model' as const, model: SemanticValueFactory.modelName(targetModel) },
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
        multiplicity: { kind: 'single' },
        semanticType: ReferenceType.model('', ''),
        targetShape: { kind: 'single', model: SemanticValueFactory.modelName('') },
        traversalTarget: { kind: 'model', model: SemanticValueFactory.modelName('') },
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
        multiplicity: { kind: 'collection' },
        semanticType: new ReadonlyCollectionType(CollectionKind.COLLECTION, ReferenceType.model('', targetModel)),
        targetShape: { kind: 'collection', model: SemanticValueFactory.modelName(targetModel) },
        traversalTarget: { kind: 'collection', model: SemanticValueFactory.modelName(targetModel) },
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
        multiplicity: { kind: 'single' },
        semanticType: ReferenceType.model('', ''),
        targetShape: { kind: 'single', model: SemanticValueFactory.modelName('') },
        traversalTarget: { kind: 'model', model: SemanticValueFactory.modelName('') },
        foreignKey: { kind: 'convention' }
    };
}

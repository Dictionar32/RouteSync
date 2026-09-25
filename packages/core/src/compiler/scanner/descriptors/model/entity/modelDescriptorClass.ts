/**
 * modelDescriptorClass.ts
 *
 * Canonical model semantic builder.
 *
 * @module compiler/scanner/descriptors/model/entity
 */

import { ModelSemanticPropertyIndex, ModelSemanticRelationIndex, type ModelSemanticDefinition } from '../../../../../types/upstream/model';
import type { ModelColumnFact, ModelAccessorFact } from '../../../../../types/upstream/modelSourceFacts';
import type { EloquentRelationAst } from '../../../../../types/upstream/eloquent';
import type { ModelCast } from '../../../../../types/upstream/model';
import type { PropertyName } from "../../../../../types/upstream/names";
import { createPropertyName } from "../../../../../types/upstream/names";
import type { ModelSemanticAccessor, ModelSemanticColumn, ModelSemanticProperty, ModelSemanticRelation, ModelSemanticSurface } from "../../../../../types/upstream/model";

function semanticTypeOfColumn(column: ModelColumnFact): import('../../../../../types/upstream/typeVocabulary').TypeExpression {
    return column.type.value;
}

function buildModelColumn(column: ModelColumnFact): ModelSemanticColumn {
    const semanticType = semanticTypeOfColumn(column);
    return Object.freeze({
        kind: 'column' as const,
        property: column.property,
        column: column.column,
        databaseType: column.databaseType,
        semanticType,
        nullability: column.nullability,
        traversal: { kind: 'scalar' as const, semanticType }
    });
}

function buildModelColumns(
    columns: readonly ModelColumnFact[],
    hidden: readonly PropertyName[]
): readonly ModelSemanticColumn[] {
    const hiddenNames = new Set(hidden.map(value => value.value.value));
    return columns
        .filter(column => !hiddenNames.has(column.property.value.value) && !hiddenNames.has(column.column.value.value))
        .map(buildModelColumn);
}

function buildModelAccessors(
    accessors: readonly ModelAccessorFact[]
): readonly ModelSemanticAccessor[] {
    return accessors.map(accessor => Object.freeze({
        kind: 'accessor' as const,
        property: accessor.property,
        method: accessor.method,
        semanticType: accessor.result,
        computation: accessor.computation,
        traversal: { kind: 'scalar' as const, semanticType: accessor.result }
    }));
}

function buildModelRelations(
    relations: readonly EloquentRelationAst[]
): readonly ModelSemanticRelation[] {
    return relations.map(relation => Object.freeze({
        kind: 'relation' as const,
        property: createPropertyName(relation.name.value.value),
        relation: relation.name,
        sourceModel: relation.sourceModel,
        type: relation.eloquentType,
        relationKind: relation.relation,
        eloquentType: relation.eloquentType,
        semanticType: relation.semanticType,
        targetModel: relation.targetModel,
        cardinality: relation.descriptor.cardinality,
        multiplicity: relation.descriptor.multiplicity,
        boundCardinality: relation.descriptor.multiplicity,
        resourceCardinality: relation.descriptor.multiplicity,
        targetShape: relation.targetShape,
        traversalTarget: relation.traversalTarget,
        foreignKey: relation.key,
        source: relation.source,
        traversal: { kind: 'relation' as const, targetModel: relation.targetModel, eloquentType: relation.eloquentType, cardinality: relation.descriptor.cardinality, multiplicity: relation.descriptor.multiplicity, targetShape: relation.targetShape, traversalTarget: relation.traversalTarget, semanticType: relation.semanticType }
    }));
}

function buildModelProperties(
    columns: readonly ModelColumnFact[],
    accessors: readonly ModelAccessorFact[],
    relations: readonly EloquentRelationAst[],
    hidden: readonly PropertyName[]
): readonly ModelSemanticProperty[] {
    const hiddenNames = new Set(hidden.map(value => value.value.value));
    const properties: ModelSemanticProperty[] = [];
    const seen = new Set<string>();

    for (const column of columns) {
        if (hiddenNames.has(column.property.value.value) || hiddenNames.has(column.column.value.value)) continue;
        if (seen.has(column.property.value.value)) continue;
        seen.add(column.property.value.value);
        properties.push(buildModelColumn(column));
    }
    for (const accessor of accessors) {
        if (seen.has(accessor.property.value.value)) continue;
        seen.add(accessor.property.value.value);
        properties.push(Object.freeze({
            kind: 'accessor' as const,
            property: accessor.property,
            method: accessor.method,
            semanticType: accessor.result,
            computation: accessor.computation,
            traversal: { kind: 'scalar' as const, semanticType: accessor.result }
        }));
    }
    for (const relation of relations) {
        const property = createPropertyName(relation.name.value.value);
        if (seen.has(property.value.value)) continue;
        seen.add(property.value.value);
        properties.push(Object.freeze({
            kind: 'relation' as const,
            property,
            relation: relation.name,
            sourceModel: relation.sourceModel,
            type: relation.eloquentType,
            relationKind: relation.relation,
            eloquentType: relation.eloquentType,
            targetModel: relation.targetModel,
            cardinality: relation.descriptor.cardinality,
            multiplicity: relation.descriptor.multiplicity,
            boundCardinality: relation.descriptor.multiplicity,
            resourceCardinality: relation.descriptor.multiplicity,
            targetShape: relation.targetShape,
            traversalTarget: relation.traversalTarget,
            foreignKey: relation.key,
            semanticType: relation.semanticType,
            source: relation.source,
            traversal: { kind: 'relation' as const, targetModel: relation.targetModel, eloquentType: relation.eloquentType, cardinality: relation.descriptor.cardinality, multiplicity: relation.descriptor.multiplicity, targetShape: relation.targetShape, traversalTarget: relation.traversalTarget, semanticType: relation.semanticType }
        }));
    }
    return properties;
}

function buildModelSurface(
    properties: readonly ModelSemanticProperty[],
    relations: readonly ModelSemanticRelation[]
): ModelSemanticSurface {
    return Object.freeze({
        properties: Object.freeze([...properties]),
        byName: new ModelSemanticPropertyIndex(properties),
        relationsByName: new ModelSemanticRelationIndex(relations)
    });
}

export function buildModelSemanticDefinition(params: {
    readonly inheritance: ModelInheritance;
    readonly capabilities: ModelSourceCapabilities;
    readonly methods: readonly ModelMethod[];
    readonly constants: readonly ModelConstant[];
    readonly identity: ModelSemanticDefinition['identity'];
    readonly key: ModelSemanticDefinition['key'];
    readonly behavior: ModelSemanticDefinition['behavior'];
    readonly exposure: ModelSemanticDefinition['exposure'];
    readonly columnFacts: readonly ModelColumnFact[];
    readonly casts: readonly ModelCast[];
    readonly accessors: readonly ModelAccessorFact[];
    readonly relations: readonly EloquentRelationAst[];
}): ModelSemanticDefinition {
    const columnFacts = Object.freeze(params.columnFacts);
    const fillable = Object.freeze(params.exposure.fillable);
    const guarded = Object.freeze(params.exposure.guarded);
    const hidden = Object.freeze(params.exposure.hidden);
    const appends = Object.freeze(params.exposure.appends);
    const semanticProperties = buildModelProperties(params.columnFacts, params.accessors, params.relations, params.exposure.hidden);
    const semanticRelations = buildModelRelations(params.relations);

    return Object.freeze({
        inheritance: params.inheritance,
        capabilities: params.capabilities,
        methods: Object.freeze([...params.methods]),
        constants: Object.freeze([...params.constants]),
        identity: Object.freeze(params.identity),
        key: Object.freeze(params.key),
        behavior: Object.freeze(params.behavior),
        exposure: Object.freeze({ fillable, guarded, hidden, appends }),
        surface: buildModelSurface(semanticProperties, semanticRelations),
        columnFacts
    });
}

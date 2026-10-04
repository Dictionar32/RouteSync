/**
 * modelSemanticDefinition.ts
 *
 * Canonical model semantic builder.
 *
 * @module compiler/scanner/semantic/model
 */

import { modelSemanticPropertyIndexFrom, modelSemanticRelationIndexFrom, type ModelSemanticDefinition } from '../../../../types/upstream/model';
import type { ModelColumnFact, ModelAccessorFact } from '../../../../types/upstream/modelSourceFacts';
import type { EloquentRelationAst } from '../../../../types/upstream/eloquent';
import type { ModelCast } from '../../../../types/upstream/model';
import type { PropertyName } from "../../../../types/upstream/names";
import { createPropertyName } from "../../../../types/upstream/names";
import type { ModelSemanticAccessor, ModelSemanticColumn, ModelSemanticProperty, ModelSemanticRelation, ModelSemanticSurface } from "../../../../types/upstream/model";
import { relationProject, relationSelect, relationAny } from '../../../../semantic/kernel/relationalSequence';
import { relationAll, relationEqual } from '../../../../semantic/kernel/semanticRelations';

function semanticTypeOfColumn(column: ModelColumnFact): import('../../../../types/upstream/typeVocabulary').TypeExpression {
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

function buildModelColumnVisible(column: ModelColumnFact, hidden: readonly PropertyName[]): boolean {
    return relationAll([
        !relationAny(relationProject(hidden, value => relationEqual(value.value.value, column.property.value.value))),
        !relationAny(relationProject(hidden, value => relationEqual(value.value.value, column.column.value.value))),
    ]);
}

function buildModelAccessor(accessor: ModelAccessorFact): ModelSemanticAccessor {
    return Object.freeze({
        kind: 'accessor' as const,
        property: accessor.property,
        method: accessor.method,
        semanticType: accessor.result,
        computation: accessor.computation,
        traversal: { kind: 'scalar' as const, semanticType: accessor.result }
    });
}

function buildModelRelation(relation: EloquentRelationAst): ModelSemanticRelation {
    return Object.freeze({
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
    });
}

function buildModelColumns(
    columns: readonly ModelColumnFact[],
    hidden: readonly PropertyName[]
): readonly ModelSemanticColumn[] {
    return relationProject(relationSelect(columns, column => buildModelColumnVisible(column, hidden)), buildModelColumn);
}

function buildModelAccessors(accessors: readonly ModelAccessorFact[]): readonly ModelSemanticAccessor[] {
    return relationProject(accessors, buildModelAccessor);
}

function buildModelRelations(relations: readonly EloquentRelationAst[]): readonly ModelSemanticRelation[] {
    return relationProject(relations, buildModelRelation);
}

function buildModelProperties(
    columns: readonly ModelColumnFact[],
    accessors: readonly ModelAccessorFact[],
    relations: readonly EloquentRelationAst[],
    hidden: readonly PropertyName[]
): readonly ModelSemanticProperty[] {
    const columnProperties = buildModelColumns(columns, hidden);
    const accessorProperties = relationProject(
        relationSelect(accessors, accessor => !relationAny(relationProject(columnProperties, property => relationEqual(property.property.value.value, accessor.property.value.value)))),
        buildModelAccessor,
    );
    const occupied = relationProject([...columnProperties, ...accessorProperties], property => property.property.value.value);
    const relationProperties = relationProject(
        relationSelect(relations, relation => !relationAny(relationProject(occupied, name => relationEqual(name, relation.name.value.value)))),
        buildModelRelation,
    );
    return Object.freeze([...columnProperties, ...accessorProperties, ...relationProperties]);
}

function buildModelSurface(
    properties: readonly ModelSemanticProperty[],
    relations: readonly ModelSemanticRelation[]
): ModelSemanticSurface {
    return Object.freeze({
        properties: Object.freeze([...properties]),
        byName: modelSemanticPropertyIndexFrom(properties),
        relationsByName: modelSemanticRelationIndexFrom(relations)
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

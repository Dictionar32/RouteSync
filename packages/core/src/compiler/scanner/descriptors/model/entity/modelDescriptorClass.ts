/**
 * modelDescriptorClass.ts
 *
 * ScannedModelDescriptor implementation.
 *
 * @module compiler/scanner/descriptors/model/entity
 */

import { ModelSemanticPropertyIndex, ModelSemanticRelationIndex } from '../../../../../types/domain/models';
import type {
    ParsedColumn,
    ParsedCast,
    ParsedAccessor,
    ParsedRelation,
    ParsedModel,
    ModelKeyType
} from "../../../../../types/route";
import { PrimitiveKind, PrimitiveType } from "../../../../types/SemanticType";
import type { ModelKeySemanticType } from "../../../../../types/domain/modelContracts";
import { SemanticValueFactory, type ModelName, type TableName, type ColumnName, type PropertyName } from "../../../../../types/domain/semanticValues";
import type { SemanticType } from "../../../../types/SemanticType";
import type { ModelSemanticAccessor, ModelSemanticColumn, ModelSemanticProperty, ModelSemanticRelation, ModelSemanticSurface } from "../../../../../types/domain/models";
import type { ScannedModelParams } from "./types";
import {
    computeModelParams,
    computeEmptyModelParams,
    computeFromTableParams
} from "./modelEntityFactory";

function buildModelColumn(column: ParsedColumn): ModelSemanticColumn {
    return Object.freeze({
        kind: 'column' as const,
        property: SemanticValueFactory.propertyName(column.propertyName),
        column: SemanticValueFactory.columnName(column.name),
        databaseType: column.type,
        semanticType: column.semanticType,
        nullability: column.nullability,
        traversal: { kind: 'scalar' as const, semanticType: column.semanticType }
    });
}

function buildModelColumns(
    columns: readonly ParsedColumn[],
    hidden: readonly string[]
): readonly ModelSemanticColumn[] {
    const hiddenNames = new Set(hidden);
    return columns
        .filter(column => !hiddenNames.has(column.propertyName) && !hiddenNames.has(column.name))
        .map(buildModelColumn);
}

function buildModelAccessors(
    accessors: readonly ParsedAccessor[]
): readonly ModelSemanticAccessor[] {
    return accessors.map(accessor => Object.freeze({
        kind: 'accessor' as const,
        property: accessor.propertyName,
        method: accessor.name,
        semanticType: accessor.computation.result,
        computation: accessor.computation,
        traversal: { kind: 'scalar' as const, semanticType: accessor.computation.result }
    }));
}

function buildModelRelations(
    relations: readonly ParsedRelation[]
): readonly ModelSemanticRelation[] {
    return relations.map(relation => Object.freeze({
        kind: 'relation' as const,
        property: SemanticValueFactory.propertyName(relation.name.value.value),
        relation: relation.name,
        sourceModel: relation.sourceModel,
        type: relation.type,
        semanticType: relation.semanticType,
        targetModel: relation.targetModel,
        cardinality: relation.cardinality,
        multiplicity: relation.multiplicity,
        boundCardinality: relation.multiplicity,
        resourceCardinality: relation.multiplicity,
        foreignKey: relation.foreignKey,
        traversal: { kind: 'relation' as const, targetModel: relation.targetModel, cardinality: relation.cardinality, semanticType: relation.semanticType }
    }));
}

function buildModelProperties(
    columns: readonly ParsedColumn[],
    accessors: readonly ParsedAccessor[],
    relations: readonly ParsedRelation[],
    hidden: readonly string[]
): readonly ModelSemanticProperty[] {
    const hiddenNames = new Set(hidden);
    const properties: ModelSemanticProperty[] = [];
    const seen = new Set<string>();

    for (const column of columns) {
        if (hiddenNames.has(column.propertyName) || hiddenNames.has(column.name)) continue;
        const property = SemanticValueFactory.propertyName(column.propertyName);
        if (seen.has(property.value.value)) continue;
        seen.add(property.value.value);
        properties.push(buildModelColumn(column));
    }

    for (const accessor of accessors) {
        const property = accessor.propertyName;
        if (seen.has(property.value.value)) continue;
        seen.add(property.value.value);
        properties.push(Object.freeze({
            kind: 'accessor' as const,
            property,
            method: accessor.name,
            semanticType: accessor.computation.result,
            computation: accessor.computation,
        traversal: { kind: 'scalar' as const, semanticType: accessor.computation.result }
        }));
    }

    for (const relation of relations) {
        const property = SemanticValueFactory.propertyName(relation.name.value.value);
        if (seen.has(property.value.value)) continue;
        seen.add(property.value.value);
        properties.push(Object.freeze({
            kind: 'relation' as const,
            property,
            relation: relation.name,
            sourceModel: relation.sourceModel,
            type: relation.type,
            targetModel: relation.targetModel,
            cardinality: relation.cardinality,
            multiplicity: relation.multiplicity,
            boundCardinality: relation.multiplicity,
            resourceCardinality: relation.multiplicity,
            foreignKey: relation.foreignKey,
            semanticType: relation.semanticType,
            traversal: { kind: 'relation' as const, targetModel: relation.targetModel, cardinality: relation.cardinality, semanticType: relation.semanticType }
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

export class ScannedModelDescriptor implements ParsedModel {
    public readonly semantic: import("../../../../../types/domain/models").ModelSemanticDefinition;
    public readonly source: {
        readonly columns: readonly ParsedColumn[];
        readonly columnFacts: readonly import("../../../../../types/upstream/modelSourceFacts").ModelColumnFact[];
        readonly casts: readonly ParsedCast[];
    };

    constructor(params: ScannedModelParams) {
        const name = SemanticValueFactory.modelName(params.name);
        const shortName = SemanticValueFactory.modelName(params.shortName);
        const table = SemanticValueFactory.tableName(params.table);
        const primaryKey = SemanticValueFactory.columnName(params.primaryKey);
        const keyType = params.keyType;
        const keySemanticType = params.keySemanticType === PrimitiveKind.NUMBER ? { kind: 'number' as const } : { kind: 'string' as const };
        const columns = Object.freeze(params.columns);
        const columnFacts = Object.freeze(params.columnFacts);
        const fillable = Object.freeze(params.fillable.map(SemanticValueFactory.propertyName));
        const guarded = Object.freeze(params.guarded.map(SemanticValueFactory.propertyName));
        const hidden = Object.freeze(params.hidden.map(SemanticValueFactory.propertyName));
        const appends = Object.freeze(params.appends.map(SemanticValueFactory.propertyName));
        const semanticProperties = buildModelProperties(params.columns, params.accessors, params.relations, params.hidden);
        const semanticRelations = buildModelRelations(params.relations);
        this.semantic = Object.freeze({
            identity: Object.freeze({ name, shortName, table, primaryKey }),
            key: Object.freeze({ type: keyType, semanticType: keySemanticType }),
            behavior: Object.freeze({ incrementing: params.incrementing, softDeletes: params.softDeletes, timestamps: params.timestamps }),
            exposure: Object.freeze({ fillable, guarded, hidden, appends }),
            surface: buildModelSurface(semanticProperties, semanticRelations)
        });
        this.source = Object.freeze({
            columns,
            columnFacts,
            casts: Object.freeze(params.casts)
        });
        Object.freeze(this);
    }

    public static create(params: {
        readonly name: string;
        readonly shortName?: string;
        readonly table?: string;
        readonly primaryKey?: string;
        readonly keyType?: ModelKeyType | string;
        readonly keySemanticType?: PrimitiveKind;
        readonly incrementing?: boolean;
        readonly softDeletes?: boolean;
        readonly timestamps?: boolean;
        readonly columns?: readonly ParsedColumn[];
        readonly columnFacts?: readonly import("../../../../../types/upstream/modelSourceFacts").ModelColumnFact[];
        readonly fillable?: readonly string[];
        readonly guarded?: readonly string[];
        readonly hidden?: readonly string[];
        readonly appends?: readonly string[];
        readonly casts?: readonly ParsedCast[];
        readonly accessors?: readonly ParsedAccessor[];
        readonly relations?: readonly ParsedRelation[];
    }): ScannedModelDescriptor {
        return new ScannedModelDescriptor(computeModelParams(params));
    }

    public static empty(name: string = "EmptyModel", table?: string): ScannedModelDescriptor {
        return new ScannedModelDescriptor(computeEmptyModelParams(name, table));
    }

    public static fromTable(table: string, name?: string): ScannedModelDescriptor {
        return new ScannedModelDescriptor(computeFromTableParams(table, name));
    }
}

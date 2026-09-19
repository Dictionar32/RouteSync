/**
 * modelDescriptorClass.ts
 *
 * ScannedModelDescriptor implementation.
 *
 * @module compiler/scanner/descriptors/model/entity
 */

import { ModelSemanticPropertyIndex } from '../../../../../types/domain/models';
import type {
    ParsedColumn,
    ParsedCast,
    ParsedAccessor,
    ParsedRelation,
    ParsedModel,
    ModelKeyType
} from "../../../../../types/route";
import { PrimitiveKind } from "../../../../types/SemanticType";
import type { ModelKeySemanticType } from "../../../../../types/domain/modelContracts";
import { SemanticValueFactory, type ModelName, type TableName, type ColumnName, type PropertyName } from "../../../../../types/domain/semanticValues";
import { NullableType, type SemanticType } from "../../../../types/SemanticType";
import type { ModelSemanticAccessor, ModelSemanticColumn, ModelSemanticProperty, ModelSemanticRelation, ModelSemanticSurface } from "../../../../../types/domain/models";
import type { ScannedModelParams } from "./types";
import {
    computeModelParams,
    computeEmptyModelParams,
    computeFromTableParams
} from "./modelEntityFactory";

function completeColumnType(column: ParsedColumn): SemanticType {
    return column.nullability.kind === 'nullable'
        ? new NullableType(column.semanticType)
        : column.semanticType;
}

function buildModelColumns(
    columns: readonly ParsedColumn[],
    casts: readonly ParsedCast[],
    hidden: readonly string[]
): readonly ModelSemanticColumn[] {
    const hiddenNames = new Set(hidden);
    return columns
        .filter(column => !hiddenNames.has(column.name))
        .map(column => {
            const cast = casts.find(item => item.column.value === column.name);
            const type = cast === undefined ? completeColumnType(column) : cast.valueType.semanticType;
            const origin = cast === undefined
                ? Object.freeze({
                    kind: 'column' as const,
                    column: SemanticValueFactory.columnName(column.name),
                    databaseType: column.type,
                    nullability: column.nullability
                })
                : Object.freeze({
                    kind: 'cast' as const,
                    column: SemanticValueFactory.columnName(column.name),
                    castKind: cast.castKind,
                    targetType: cast.targetType,
                    valueType: cast.valueType
                });
            return Object.freeze({
                kind: 'column' as const,
                property: SemanticValueFactory.propertyName(column.propertyName),
                column: SemanticValueFactory.columnName(column.name),
                type,
                origin
            });
        });
}

function buildModelAccessors(
    accessors: readonly ParsedAccessor[]
): readonly ModelSemanticAccessor[] {
    return accessors.map(accessor => Object.freeze({
        kind: 'accessor' as const,
        property: accessor.propertyName,
        method: accessor.name,
        type: accessor.computation.result,
        computation: accessor.computation
    }));
}

function buildModelRelations(
    relations: readonly ParsedRelation[]
): readonly ModelSemanticRelation[] {
    return relations.map(relation => Object.freeze({
        kind: 'relation' as const,
        property: relation.name,
        relation: relation.name,
        type: relation.type,
        targetModel: relation.targetModel,
        cardinality: relation.cardinality,
        multiplicity: relation.multiplicity,
        targetShape: relation.targetShape,
        traversalTarget: relation.traversalTarget,
        foreignKey: relation.foreignKey,
        semanticType: relation.semanticType
    }));
}

function buildModelProperties(
    columns: readonly ParsedColumn[],
    accessors: readonly ParsedAccessor[],
    relations: readonly ParsedRelation[],
    casts: readonly ParsedCast[],
    hidden: readonly string[]
): readonly ModelSemanticProperty[] {
    const hiddenNames = new Set(hidden);
    const properties: ModelSemanticProperty[] = [];
    const seen = new Set<string>();

    for (const column of columns) {
        if (hiddenNames.has(column.name)) continue;
        const property = SemanticValueFactory.propertyName(column.propertyName);
        if (seen.has(property.value)) continue;
        seen.add(property.value);
        const cast = casts.find(item => item.column.value === column.name);
        properties.push(Object.freeze({
            kind: 'column' as const,
            property,
            column: SemanticValueFactory.columnName(column.name),
            type: cast === undefined ? completeColumnType(column) : cast.valueType.semanticType,
            origin: cast === undefined
                ? Object.freeze({
                    kind: 'column' as const,
                    column: SemanticValueFactory.columnName(column.name),
                    databaseType: column.type,
                    nullability: column.nullability
                })
                : Object.freeze({
                    kind: 'cast' as const,
                    column: SemanticValueFactory.columnName(column.name),
                    castKind: cast.castKind,
                    targetType: cast.targetType,
                    valueType: cast.valueType
                })
        }));
    }

    for (const accessor of accessors) {
        const property = accessor.propertyName;
        if (seen.has(property.value)) continue;
        seen.add(property.value);
        properties.push(Object.freeze({
            kind: 'accessor' as const,
            property,
            method: accessor.name,
            type: accessor.computation.result,
            computation: accessor.computation
        }));
    }

    for (const relation of relations) {
        const property = relation.name;
        if (seen.has(property.value)) continue;
        seen.add(property.value);
        properties.push(Object.freeze({
            kind: 'relation' as const,
            property,
            relation: property,
            type: relation.type,
            targetModel: relation.targetModel,
            cardinality: relation.cardinality,
            multiplicity: relation.multiplicity,
            targetShape: relation.targetShape,
            traversalTarget: relation.traversalTarget,
            foreignKey: relation.foreignKey,
            semanticType: relation.semanticType
        }));
    }

    return properties;
}

function buildModelSurface(
    properties: readonly ModelSemanticProperty[],
    columns: readonly ModelSemanticColumn[],
    accessors: readonly ModelSemanticAccessor[],
    relations: readonly ModelSemanticRelation[]
): ModelSemanticSurface {
    const byName = new ModelSemanticPropertyIndex(properties);
    return Object.freeze({
        properties: Object.freeze([...properties]),
        columns: Object.freeze([...columns]),
        accessors: Object.freeze([...accessors]),
        relations: Object.freeze([...relations]),
        byName
    });
}

export class ScannedModelDescriptor implements ParsedModel {
    public readonly name: ModelName;
    public readonly shortName: ModelName;
    public readonly table: TableName;
    public readonly primaryKey: ColumnName;
    public readonly keyType: ModelKeyType;
    public readonly keySemanticType: ModelKeySemanticType;
    public readonly incrementing: boolean;
    public readonly softDeletes: boolean;
    public readonly timestamps: boolean;
    public readonly columns: readonly ParsedColumn[];
    public readonly semantic: import("../../../../../types/domain/models").ModelSemanticDefinition;
    public readonly fillable: readonly PropertyName[];
    public readonly guarded: readonly PropertyName[];
    public readonly hidden: readonly PropertyName[];
    public readonly appends: readonly PropertyName[];
    public readonly casts: readonly ParsedCast[];
    public readonly accessors: readonly ParsedAccessor[];
    public readonly relations: readonly ParsedRelation[];

    constructor(params: ScannedModelParams) {
        this.name = SemanticValueFactory.modelName(params.name);
        this.shortName = SemanticValueFactory.modelName(params.shortName);
        this.table = SemanticValueFactory.tableName(params.table);
        this.primaryKey = SemanticValueFactory.columnName(params.primaryKey);
        this.keyType = params.keyType;
        this.keySemanticType = params.keySemanticType === PrimitiveKind.NUMBER ? { kind: 'number' } : { kind: 'string' };
        this.incrementing = params.incrementing;
        this.softDeletes = params.softDeletes;
        this.timestamps = params.timestamps;
        const resolvedColumns = params.columns.map(column => {
            const cast = params.casts.find(item => item.column.value === column.name);
            return cast === undefined
                ? column
                : Object.freeze({ ...column, semanticType: cast.valueType.semanticType });
        });
        this.columns = Object.freeze(resolvedColumns);
        const semanticProperties = buildModelProperties(resolvedColumns, params.accessors, params.relations, params.casts, params.hidden);
        const semanticColumns = buildModelColumns(resolvedColumns, params.casts, params.hidden);
        const semanticAccessors = buildModelAccessors(params.accessors);
        const semanticRelations = buildModelRelations(params.relations);
        this.semantic = Object.freeze({
            identity: Object.freeze({
                name: this.name,
                shortName: this.shortName,
                table: this.table,
                primaryKey: this.primaryKey
            }),
            key: Object.freeze({
                type: this.keyType,
                semanticType: this.keySemanticType
            }),
            behavior: Object.freeze({
                incrementing: this.incrementing,
                softDeletes: this.softDeletes,
                timestamps: this.timestamps
            }),
            surface: buildModelSurface(semanticProperties, semanticColumns, semanticAccessors, semanticRelations)
        });
        this.fillable = params.fillable.map(SemanticValueFactory.propertyName);
        this.guarded = params.guarded.map(SemanticValueFactory.propertyName);
        this.hidden = params.hidden.map(SemanticValueFactory.propertyName);
        this.appends = params.appends.map(SemanticValueFactory.propertyName);
        this.casts = params.casts;
        this.accessors = params.accessors;
        this.relations = params.relations;
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

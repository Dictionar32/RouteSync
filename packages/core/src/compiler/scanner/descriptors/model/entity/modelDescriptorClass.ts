/**
 * modelDescriptorClass.ts
 *
 * ScannedModelDescriptor implementation.
 *
 * @module compiler/scanner/descriptors/model/entity
 */

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
import type { ScannedModelParams } from "./types";
import {
    computeModelParams,
    computeEmptyModelParams,
    computeFromTableParams
} from "./modelEntityFactory";

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
        this.columns = params.columns;
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

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
import type { PrimitiveKind } from "../../../../types/SemanticType";
import type { ScannedModelParams } from "./types";
import {
    computeModelParams,
    computeEmptyModelParams,
    computeFromTableParams
} from "./modelEntityFactory";

export class ScannedModelDescriptor implements ParsedModel {
    public readonly name: string;
    public readonly shortName: string;
    public readonly table: string;
    public readonly primaryKey: string;
    public readonly keyType: ModelKeyType;
    public readonly keySemanticType: PrimitiveKind;
    public readonly incrementing: boolean;
    public readonly softDeletes: boolean;
    public readonly timestamps: boolean;
    public readonly columns: readonly ParsedColumn[];
    public readonly fillable: readonly string[];
    public readonly guarded: readonly string[];
    public readonly hidden: readonly string[];
    public readonly appends: readonly string[];
    public readonly casts: readonly ParsedCast[];
    public readonly accessors: readonly ParsedAccessor[];
    public readonly relations: readonly ParsedRelation[];

    constructor(params: ScannedModelParams) {
        this.name = params.name;
        this.shortName = params.shortName;
        this.table = params.table;
        this.primaryKey = params.primaryKey;
        this.keyType = params.keyType;
        this.keySemanticType = params.keySemanticType;
        this.incrementing = params.incrementing;
        this.softDeletes = params.softDeletes;
        this.timestamps = params.timestamps;
        this.columns = params.columns;
        this.fillable = params.fillable;
        this.guarded = params.guarded;
        this.hidden = params.hidden;
        this.appends = params.appends;
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

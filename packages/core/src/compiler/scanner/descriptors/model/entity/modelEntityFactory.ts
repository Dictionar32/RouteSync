/**
 * modelEntityFactory.ts
 *
 * Parameter computation and normalizer for model entity descriptors.
 *
 * @module compiler/scanner/descriptors/model/entity
 */

import {
    type ParsedColumn,
    type ParsedCast,
    type ParsedAccessor,
    type ParsedRelation,
    type ModelKeyType,
    ModelKeyTypeMapper,
    MODEL_KEY_TYPE_REGISTRY
} from "../../../../../types/route";
import type { PrimitiveKind } from "../../../../types/SemanticType";
import { toPascalCase, extractClassBasename, inferLaravelTableName } from "../../../../../utils/resource-naming";
import { ScannedModelColumnDescriptor } from "../modelColumnDescriptor";
import type { ScannedModelParams } from "./types";

export function computeModelParams({
    name,
    shortName,
    table,
    primaryKey = "id",
    keyType = "int",
    keySemanticType,
    incrementing = true,
    softDeletes,
    timestamps,
    columns = [],
    fillable = [],
    guarded = ["*"],
    hidden = [],
    appends = [],
    casts = [],
    accessors = [],
    relations = []
}: {
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
}): ScannedModelParams {
    const defaultShortName = extractClassBasename(name);
    const resolvedShortName = shortName ?? defaultShortName;
    const resolvedTable = table ?? inferLaravelTableName(defaultShortName);
    const normalizedKeyType: ModelKeyType = ModelKeyTypeMapper.normalize(keyType === undefined ? "int" : keyType);
    const resolvedKeySemantic: PrimitiveKind = keySemanticType ?? MODEL_KEY_TYPE_REGISTRY[normalizedKeyType].primitiveKind;
    const resolvedSoftDeletes = softDeletes ?? columns.some(c => c.name === "deleted_at");
    const resolvedTimestamps = timestamps ?? (columns.some(c => c.name === "created_at") && columns.some(c => c.name === "updated_at"));

    return {
        name,
        shortName: resolvedShortName,
        table: resolvedTable,
        primaryKey,
        keyType: normalizedKeyType,
        keySemanticType: resolvedKeySemantic,
        incrementing,
        softDeletes: resolvedSoftDeletes,
        timestamps: resolvedTimestamps,
        columns: Object.freeze([...columns]),
        fillable: Object.freeze([...fillable]),
        guarded: Object.freeze([...guarded]),
        hidden: Object.freeze([...hidden]),
        appends: Object.freeze([...appends]),
        casts: Object.freeze([...casts]),
        accessors: Object.freeze([...accessors]),
        relations: Object.freeze([...relations])
    };
}

export function computeEmptyModelParams(name: string = "EmptyModel", table?: string): ScannedModelParams {
    return computeModelParams({
        name,
        table,
        columns: [],
        fillable: [],
        guarded: ["*"],
        hidden: [],
        appends: [],
        casts: [],
        accessors: [],
        relations: []
    });
}

export function computeFromTableParams(table: string, name?: string): ScannedModelParams {
    const resolvedName = name ?? toPascalCase(table.endsWith('s') ? table.slice(0, -1) : table);
    return computeModelParams({
        name: resolvedName,
        table,
        columns: [ScannedModelColumnDescriptor.primaryKey()]
    });
}

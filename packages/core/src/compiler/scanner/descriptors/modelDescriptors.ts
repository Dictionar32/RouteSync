/**
 * modelDescriptors.ts
 *
 * AST descriptors for Eloquent Models, Columns, Casts, Accessors, and Relations.
 *
 * @module core/compiler/scanner/descriptors/modelDescriptors
 */

import {
    ParsedCast,
    ParsedRelation,
    SingleRelationDescriptor,
    CollectionRelationDescriptor,
    ParsedColumn,
    ParsedAccessor,
    ParsedModel,
    EloquentCastKind,
    EloquentCastMapper,
    EloquentRelationClassifier,
    EloquentRelationType,
    EloquentRelationCardinality,
    DatabaseColumnKind,
    DatabaseColumnTypeMapper,
    ModelKeyType,
    ModelKeyTypeMapper,
    MODEL_KEY_TYPE_REGISTRY
} from "../../../types/route";
import { PrimitiveKind } from "../../types/SemanticType";
import { toCamelCase, extractClassBasename, inferLaravelTableName } from "../../../utils/resource-naming";

export interface ScannedModelCastParams {
    readonly column: string;
    readonly targetType: string;
    readonly castKind: EloquentCastKind;
    readonly semanticType: PrimitiveKind;
}

/**
 * Reusable Constructor: Scanned Model Cast Descriptor.
 */
export class ScannedModelCastDescriptor implements ParsedCast {
    public readonly column: string;
    public readonly targetType: string;
    public readonly castKind: EloquentCastKind;
    public readonly semanticType: PrimitiveKind;

    constructor({ column, targetType, castKind, semanticType }: ScannedModelCastParams) {
        this.column = column;
        this.targetType = targetType;
        this.castKind = castKind;
        this.semanticType = semanticType;
        Object.freeze(this);
    }

    public static create({ column, targetType }: { readonly column: string; readonly targetType: string }): ScannedModelCastDescriptor {
        const mapped = EloquentCastMapper.map(targetType);
        return new ScannedModelCastDescriptor({
            column,
            targetType,
            castKind: mapped.castKind,
            semanticType: mapped.semanticType
        });
    }
}

export interface ScannedModelRelationParams {
    readonly name: string;
    readonly type: EloquentRelationType;
    readonly modelName: string;
    readonly targetModel: string;
    readonly cardinality: EloquentRelationCardinality;
    readonly isCollection: boolean;
    readonly foreignKey: string | null;
}

/**
 * Reusable Constructor: Scanned Model Relation Descriptor.
 */
export class ScannedModelRelationDescriptor implements ParsedRelation {
    public readonly name: string;
    public readonly type: EloquentRelationType;
    public readonly modelName: string;
    public readonly targetModel: string;
    public readonly cardinality: EloquentRelationCardinality;
    public readonly isCollection: boolean;
    public readonly foreignKey: string | null;

    constructor(params: ScannedModelRelationParams) {
        this.name = params.name;
        this.type = params.type;
        this.modelName = params.modelName;
        this.targetModel = params.targetModel;
        this.cardinality = params.cardinality;
        this.isCollection = params.isCollection;
        this.foreignKey = params.foreignKey;
        Object.freeze(this);
    }

    public static create({
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
    }): ScannedModelRelationDescriptor {
        const desc = EloquentRelationClassifier.getDescriptor(type);
        return new ScannedModelRelationDescriptor({
            name,
            type,
            modelName,
            targetModel,
            cardinality: cardinality ?? desc.cardinality,
            isCollection: isCollection ?? desc.isCollection,
            foreignKey
        });
    }

    public static single({
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
    }): SingleRelationDescriptor {
        return new ScannedModelRelationDescriptor({
            name,
            type,
            modelName,
            targetModel,
            cardinality: "one",
            isCollection: false,
            foreignKey
        }) as SingleRelationDescriptor;
    }

    public static collection({
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
    }): CollectionRelationDescriptor {
        return new ScannedModelRelationDescriptor({
            name,
            type,
            modelName,
            targetModel,
            cardinality: "many",
            isCollection: true,
            foreignKey
        }) as CollectionRelationDescriptor;
    }
}

export interface ScannedModelColumnParams {
    readonly name: string;
    readonly propertyName: string;
    readonly type: string;
    readonly columnKind: DatabaseColumnKind;
    readonly nullable: boolean;
    readonly semanticType: PrimitiveKind;
    readonly enumValues: readonly string[];
}

/**
 * Reusable Constructor: Scanned Model Column Descriptor.
 */
export class ScannedModelColumnDescriptor implements ParsedColumn {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly type: string;
    public readonly columnKind: DatabaseColumnKind;
    public readonly nullable: boolean;
    public readonly semanticType: PrimitiveKind;
    public readonly enumValues: readonly string[];

    constructor({ name, propertyName, type, columnKind, nullable, semanticType, enumValues }: ScannedModelColumnParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.type = type;
        this.columnKind = columnKind;
        this.nullable = nullable;
        this.semanticType = semanticType;
        this.enumValues = Object.freeze([...enumValues]);
        Object.freeze(this);
    }

    public static fromSchema({
        name,
        propertyName,
        type = "varchar",
        columnKind,
        nullable = true,
        semanticType,
        enumValues = []
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly type?: string;
        readonly columnKind?: DatabaseColumnKind;
        readonly nullable?: boolean;
        readonly semanticType?: PrimitiveKind;
        readonly enumValues?: readonly string[];
    }): ScannedModelColumnDescriptor {
        return new ScannedModelColumnDescriptor({
            name,
            propertyName: propertyName ?? toCamelCase(name),
            type,
            columnKind: columnKind ?? (type.toLowerCase().startsWith("tinyint(1)") ? DatabaseColumnKind.Boolean : DatabaseColumnTypeMapper.toColumnKind(type)),
            nullable,
            semanticType: semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(type),
            enumValues
        });
    }

    public static create(params: Parameters<typeof ScannedModelColumnDescriptor.fromSchema>[0]): ScannedModelColumnDescriptor {
        return ScannedModelColumnDescriptor.fromSchema(params);
    }
}

export interface ScannedModelAccessorParams {
    readonly name: string;
    readonly propertyName: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly semanticType: PrimitiveKind;
}

/**
 * Reusable Constructor: Scanned Model Accessor Descriptor.
 */
export class ScannedModelAccessorDescriptor implements ParsedAccessor {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly type: string;
    public readonly nullable: boolean;
    public readonly semanticType: PrimitiveKind;

    constructor({
        name,
        propertyName,
        type,
        nullable,
        semanticType
    }: ScannedModelAccessorParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.type = type;
        this.nullable = nullable;
        this.semanticType = semanticType;
        Object.freeze(this);
    }

    public static fromReturnType({
        name,
        propertyName,
        type,
        nullable = false,
        semanticType
    }: {
        readonly name: string;
        readonly propertyName?: string;
        readonly type: string;
        readonly nullable?: boolean;
        readonly semanticType?: PrimitiveKind;
    }): ScannedModelAccessorDescriptor {
        let resolvedSemanticType = semanticType;
        if (!resolvedSemanticType) {
            if (type === "number" || type === "int" || type === "float") {
                resolvedSemanticType = PrimitiveKind.NUMBER;
            } else if (type === "boolean" || type === "bool") {
                resolvedSemanticType = PrimitiveKind.BOOLEAN;
            } else {
                resolvedSemanticType = PrimitiveKind.STRING;
            }
        }
        return new ScannedModelAccessorDescriptor({
            name,
            propertyName: propertyName ?? toCamelCase(name),
            type,
            nullable,
            semanticType: resolvedSemanticType
        });
    }

    public static create(params: Parameters<typeof ScannedModelAccessorDescriptor.fromReturnType>[0]): ScannedModelAccessorDescriptor {
        return ScannedModelAccessorDescriptor.fromReturnType(params);
    }
}

export interface ScannedModelParams {
    readonly name: string;
    readonly shortName: string;
    readonly table: string;
    readonly primaryKey: string;
    readonly keyType: ModelKeyType;
    readonly keySemanticType: PrimitiveKind;
    readonly incrementing: boolean;
    readonly softDeletes: boolean;
    readonly timestamps: boolean;
    readonly columns: readonly ParsedColumn[];
    readonly fillable: readonly string[];
    readonly guarded: readonly string[];
    readonly hidden: readonly string[];
    readonly appends: readonly string[];
    readonly casts: readonly ParsedCast[];
    readonly accessors: readonly ParsedAccessor[];
    readonly relations: readonly ParsedRelation[];
}

/**
 * Reusable Constructor: Scanned Model Descriptor.
 */
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

    constructor({
        name,
        shortName,
        table,
        primaryKey,
        keyType,
        keySemanticType,
        incrementing,
        softDeletes,
        timestamps,
        columns,
        fillable,
        guarded,
        hidden,
        appends,
        casts,
        accessors,
        relations
    }: ScannedModelParams) {
        this.name = name;
        this.shortName = shortName;
        this.table = table;
        this.primaryKey = primaryKey;
        this.keyType = keyType;
        this.keySemanticType = keySemanticType;
        this.incrementing = incrementing;
        this.softDeletes = softDeletes;
        this.timestamps = timestamps;
        this.columns = Object.freeze(columns);
        this.fillable = Object.freeze(fillable);
        this.guarded = Object.freeze(guarded);
        this.hidden = Object.freeze(hidden);
        this.appends = Object.freeze(appends);
        this.casts = Object.freeze(casts);
        this.accessors = Object.freeze(accessors);
        this.relations = Object.freeze(relations);
        Object.freeze(this);
    }

    public static create({
        name,
        shortName,
        table,
        primaryKey = "id",
        keyType = "int",
        keySemanticType,
        incrementing = true,
        softDeletes,
        timestamps,
        columns,
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
        readonly columns: readonly ParsedColumn[];
        readonly fillable?: readonly string[];
        readonly guarded?: readonly string[];
        readonly hidden?: readonly string[];
        readonly appends?: readonly string[];
        readonly casts?: readonly ParsedCast[];
        readonly accessors?: readonly ParsedAccessor[];
        readonly relations?: readonly ParsedRelation[];
    }): ScannedModelDescriptor {
        const defaultShortName = extractClassBasename(name);
        const resolvedShortName = shortName ?? defaultShortName;
        const resolvedTable = table ?? inferLaravelTableName(defaultShortName);
        const normalizedKeyType: ModelKeyType = ModelKeyTypeMapper.normalize(keyType);
        const resolvedKeySemantic: PrimitiveKind = keySemanticType ?? MODEL_KEY_TYPE_REGISTRY[normalizedKeyType].primitiveKind;

        return new ScannedModelDescriptor({
            name,
            shortName: resolvedShortName,
            table: resolvedTable,
            primaryKey,
            keyType: normalizedKeyType,
            keySemanticType: resolvedKeySemantic,
            incrementing,
            softDeletes: softDeletes ?? columns.some(c => c.name === "deleted_at"),
            timestamps: timestamps ?? (columns.some(c => c.name === "created_at") && columns.some(c => c.name === "updated_at")),
            columns,
            fillable,
            guarded,
            hidden,
            appends,
            casts,
            accessors,
            relations
        });
    }
}

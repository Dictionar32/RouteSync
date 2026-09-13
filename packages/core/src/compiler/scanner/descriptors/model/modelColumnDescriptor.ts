/**
 * modelColumnDescriptor.ts
 *
 * AST descriptor for Eloquent Model Columns.
 *
 * @module core/compiler/scanner/descriptors/model/modelColumnDescriptor
 */

import {
    ParsedColumn,
    DatabaseColumnKind,
    DatabaseColumnTypeMapper
} from "../../../../types/route";
import { PrimitiveKind } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";

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
        this.enumValues = enumValues;
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
            enumValues: Object.freeze([...enumValues])
        });
    }

    public static create(params: Parameters<typeof ScannedModelColumnDescriptor.fromSchema>[0]): ScannedModelColumnDescriptor {
        return ScannedModelColumnDescriptor.fromSchema(params);
    }

    public static primaryKey(name: string = "id"): ScannedModelColumnDescriptor {
        return new ScannedModelColumnDescriptor({
            name,
            propertyName: toCamelCase(name),
            type: "bigint",
            columnKind: DatabaseColumnKind.BigInt,
            nullable: false,
            semanticType: PrimitiveKind.NUMBER,
            enumValues: Object.freeze([])
        });
    }

    public static string(name: string, nullable: boolean = false): ScannedModelColumnDescriptor {
        return new ScannedModelColumnDescriptor({
            name,
            propertyName: toCamelCase(name),
            type: "varchar",
            columnKind: DatabaseColumnKind.String,
            nullable,
            semanticType: PrimitiveKind.STRING,
            enumValues: Object.freeze([])
        });
    }
}

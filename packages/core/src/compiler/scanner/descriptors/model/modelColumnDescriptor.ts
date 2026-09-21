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
import { PrimitiveKind, PrimitiveType, type SemanticType } from "../../../types/SemanticType";
import type { DatabaseColumnType } from "../../../../types/domain/modelContracts";
import { toCamelCase } from "../../../../utils/resource-naming";

export interface ScannedModelColumnParams {
    readonly name: string;
    readonly propertyName: string;
    readonly type: DatabaseColumnType;
    readonly columnKind: DatabaseColumnKind;
    readonly nullable: boolean;
    readonly nullability: import("../../../../types/domain/modelContracts").Nullability;
    readonly semanticType: SemanticType;
    readonly enumValues: readonly string[];
}

const DATABASE_TYPES: { readonly [K in DatabaseColumnKind]: DatabaseColumnType } = {
    bigint: { kind: 'bigint' }, integer: { kind: 'integer' }, smallint: { kind: 'smallint' }, tinyint: { kind: 'tinyint' },
    float: { kind: 'float' }, double: { kind: 'double' }, decimal: { kind: 'decimal' }, boolean: { kind: 'boolean' },
    string: { kind: 'string' }, text: { kind: 'text' }, mediumtext: { kind: 'mediumtext' }, longtext: { kind: 'longtext' },
    date: { kind: 'date' }, datetime: { kind: 'datetime' }, timestamp: { kind: 'timestamp' }, time: { kind: 'time' },
    json: { kind: 'json' }, enum: { kind: 'enum', values: Object.freeze([]) }, binary: { kind: 'binary' },
    uuid: { kind: 'uuid' }, ulid: { kind: 'ulid' }, unknown: { kind: 'unsupported', reason: 'unsupported_sql_type' }
};

const databaseType = (kind: DatabaseColumnKind, enumValues: readonly string[]): DatabaseColumnType =>
    kind === 'enum' ? { kind: 'enum', values: Object.freeze([...enumValues]) } : DATABASE_TYPES[kind];

/**
 * Reusable Constructor: Scanned Model Column Descriptor.
 */
export class ScannedModelColumnDescriptor implements ParsedColumn {
    public readonly name: string;
    public readonly propertyName: string;
    public readonly type: DatabaseColumnType;
    public readonly columnKind: DatabaseColumnKind;
    public readonly nullable: boolean;
    public readonly nullability: import("../../../../types/domain/modelContracts").Nullability;
    public readonly semanticType: SemanticType;
    public readonly enumValues: readonly string[];

    constructor({ name, propertyName, type, columnKind, nullable, nullability, semanticType, enumValues }: ScannedModelColumnParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.type = type;
        this.columnKind = columnKind;
        this.nullable = nullable;
        this.nullability = nullability;
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
            propertyName,
            type: databaseType(columnKind, enumValues),
            columnKind,
            nullable,
            nullability: nullable ? { kind: 'nullable' } : { kind: 'non_nullable' },
            semanticType: new PrimitiveType(semanticType),
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
            type: { kind: 'bigint' },
            columnKind: DatabaseColumnKind.BigInt,
            nullable: false,
            nullability: { kind: 'non_nullable' },
            semanticType: new PrimitiveType(PrimitiveKind.NUMBER),
            enumValues: Object.freeze([])
        });
    }

    public static string(name: string, nullable: boolean = false): ScannedModelColumnDescriptor {
        return new ScannedModelColumnDescriptor({
            name,
            propertyName: toCamelCase(name),
            type: { kind: 'string' },
            columnKind: DatabaseColumnKind.String,
            nullable,
            nullability: nullable ? { kind: 'nullable' } : { kind: 'non_nullable' },
            semanticType: new PrimitiveType(PrimitiveKind.STRING),
            enumValues: Object.freeze([])
        });
    }
}

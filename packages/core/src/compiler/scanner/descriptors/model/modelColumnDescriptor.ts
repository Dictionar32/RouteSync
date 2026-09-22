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
import type { TypeExpression } from "../../../../types/upstream/typeVocabulary";
import type { PrimitiveVocabulary } from "../../../../types/upstream/primitiveVocabulary";
import type { DatabaseColumnType, Nullability } from "../../../../types/domain/modelContracts";
import { toCamelCase } from "../../../../utils/resource-naming";
import { SemanticValueFactory, type ColumnName, type PropertyName } from "../../../../types/domain/semanticValues";

export interface ScannedModelColumnParams {
    readonly name: ColumnName;
    readonly propertyName: PropertyName;
    readonly type: DatabaseColumnType;
    readonly columnKind: DatabaseColumnKind;
    readonly nullability: Nullability;
    readonly semanticType: TypeExpression;
    readonly enumValues: readonly string[];
}

const PRIMITIVE_VALUES: { readonly [K in PrimitiveKind]: PrimitiveVocabulary } = {
    [PrimitiveKind.STRING]: { kind: 'string' },
    [PrimitiveKind.NUMBER]: { kind: 'number' },
    [PrimitiveKind.BOOLEAN]: { kind: 'boolean' },
    [PrimitiveKind.DATETIME]: { kind: 'date_time' },
    [PrimitiveKind.FILE]: { kind: 'file' },
    [PrimitiveKind.UNKNOWN]: { kind: 'unknown' },
    [PrimitiveKind.UNSPECIFIED]: { kind: 'unknown' }
};
const primitiveType = (kind: PrimitiveKind): TypeExpression => ({ kind: 'primitive', value: PRIMITIVE_VALUES[kind] });

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
    public readonly name: ColumnName;
    public readonly propertyName: PropertyName;
    public readonly type: DatabaseColumnType;
    public readonly columnKind: DatabaseColumnKind;
    public readonly nullability: Nullability;
    public readonly semanticType: TypeExpression;
    public readonly enumValues: readonly string[];

    constructor({ name, propertyName, type, columnKind, nullability, semanticType, enumValues }: ScannedModelColumnParams) {
        this.name = name;
        this.propertyName = propertyName;
        this.type = type;
        this.columnKind = columnKind;
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
            name: SemanticValueFactory.columnName(name),
            propertyName: SemanticValueFactory.propertyName(propertyName ?? toCamelCase(name)),
            type: databaseType(columnKind, enumValues),
            columnKind,
            nullability: nullable ? { kind: 'nullable' } : { kind: 'non_nullable' },
            semanticType: primitiveType(semanticType),
            enumValues: Object.freeze([...enumValues])
        });
    }

    public static create(params: Parameters<typeof ScannedModelColumnDescriptor.fromSchema>[0]): ScannedModelColumnDescriptor {
        return ScannedModelColumnDescriptor.fromSchema(params);
    }

    public static primaryKey(name: string = "id"): ScannedModelColumnDescriptor {
        return new ScannedModelColumnDescriptor({
            name: SemanticValueFactory.columnName(name),
            propertyName: SemanticValueFactory.propertyName(toCamelCase(name)),
            type: { kind: 'bigint' },
            columnKind: DatabaseColumnKind.BigInt,
            nullability: { kind: 'non_nullable' },
            semanticType: primitiveType(PrimitiveKind.NUMBER),
            enumValues: Object.freeze([])
        });
    }

    public static string(name: string, nullable: boolean = false): ScannedModelColumnDescriptor {
        return new ScannedModelColumnDescriptor({
            name: SemanticValueFactory.columnName(name),
            propertyName: SemanticValueFactory.propertyName(toCamelCase(name)),
            type: { kind: 'string' },
            columnKind: DatabaseColumnKind.String,
            nullability: nullable ? { kind: 'nullable' } : { kind: 'non_nullable' },
            semanticType: primitiveType(PrimitiveKind.STRING),
            enumValues: Object.freeze([])
        });
    }
}

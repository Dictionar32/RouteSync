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
import { relationEqual } from "../../../../semantic/kernel/semanticRelations";
import { relationGate } from "../../../../semantic/kernel/relationalSequence";

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
    [PrimitiveKind.INDETERMINATE]: { kind: 'indeterminate' },
    [PrimitiveKind.UNSPECIFIED]: { kind: 'indeterminate' }
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
    relationGate(relationEqual(kind, 'enum'), () => ({ kind: 'enum', values: Object.freeze([...enumValues]) }), () => DATABASE_TYPES[kind]);

/**
 * Reusable Constructor: Scanned Model Column Descriptor.
 */
export interface ScannedModelColumnDescriptor extends ParsedColumn {
    readonly name: ColumnName;
    readonly propertyName: PropertyName;
    readonly type: DatabaseColumnType;
    readonly columnKind: DatabaseColumnKind;
    readonly nullability: Nullability;
    readonly semanticType: TypeExpression;
    readonly enumValues: readonly string[];
}

const columnDescriptor = (params: ScannedModelColumnParams): ScannedModelColumnDescriptor => Object.freeze({ ...params });

const fromSchema = ({
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
}): ScannedModelColumnDescriptor => columnDescriptor({
    name: SemanticValueFactory.columnName(name),
    propertyName: SemanticValueFactory.propertyName(relationGate(Object.is(typeof propertyName, 'string'), () => propertyName as string, () => toCamelCase(name))),
    type: databaseType(columnKind, enumValues),
    columnKind,
    nullability: relationGate(relationEqual(nullable, true), () => ({ kind: 'nullable' }), () => ({ kind: 'non_nullable' })),
    semanticType: primitiveType(semanticType),
    enumValues: Object.freeze([...enumValues])
});

export const ScannedModelColumnDescriptor = Object.freeze({
    fromSchema,
    create: (params: Parameters<typeof fromSchema>[0]): ScannedModelColumnDescriptor => fromSchema(params),
    primaryKey: (name: string = "id"): ScannedModelColumnDescriptor => columnDescriptor({
        name: SemanticValueFactory.columnName(name),
        propertyName: SemanticValueFactory.propertyName(toCamelCase(name)),
        type: { kind: 'bigint' },
        columnKind: DatabaseColumnKind.BigInt,
        nullability: { kind: 'non_nullable' },
        semanticType: primitiveType(PrimitiveKind.NUMBER),
        enumValues: Object.freeze([])
    }),
    string: (name: string, nullable: boolean = false): ScannedModelColumnDescriptor => columnDescriptor({
        name: SemanticValueFactory.columnName(name),
        propertyName: SemanticValueFactory.propertyName(toCamelCase(name)),
        type: { kind: 'string' },
        columnKind: DatabaseColumnKind.String,
        nullability: relationGate(relationEqual(nullable, true), () => ({ kind: 'nullable' }), () => ({ kind: 'non_nullable' })),
        semanticType: primitiveType(PrimitiveKind.STRING),
        enumValues: Object.freeze([])
    })
});

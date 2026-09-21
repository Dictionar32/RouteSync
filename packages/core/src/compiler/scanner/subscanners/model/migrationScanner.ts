/**
 * migrationScanner.ts
 *
 * Scans database/migrations/*.php for table schemas and column definitions.
 *
 * @module core/compiler/scanner/subscanners/model/migrationScanner
 */

import { DatabaseColumnTypeMapper } from "../../../../types/route";
import { scanMigrationAsts } from '../migrationAstCanonical';

import type { ParsedColumn } from "../../../../types/route";
import { toCamelCase } from "../../../../utils/resource-naming";

/**
 * Scans migration files in the project to build a map of table name to column definitions.
 */
export async function scanMigrations(projectRoot: string): Promise<Map<string, ParsedColumn[]>> {
    const migrationAsts = await scanMigrationAsts(projectRoot);
    const migrationMap = new Map<string, ParsedColumn[]>();

    for (const migration of migrationAsts) {
        const operations = migration.definition.operations.items;
        let current = operations;
        while (current.kind === 'cons') {
            const operation = current.head;
            if (operation.kind === 'create_table') {
                const tableName = operation.table.value.value;
                const columns: ParsedColumn[] = [];
                let columnItems = operation.columns.items;
                while (columnItems.kind === 'cons') {
                    const column = columnItems.head;
                    columns.push({
                        name: column.name.value.value,
                        propertyName: toCamelCase(column.name.value.value),
                        type: domainColumnType(column.databaseType),
                        nullability: domainNullability(column.nullability),
                        semanticType: DatabaseColumnTypeMapper.toPrimitiveKind(primitiveTypeName(column.databaseType))
                    });
                    columnItems = columnItems.tail;
                }
                migrationMap.set(tableName, columns);
            }
            current = current.tail;
        }
    }

    return migrationMap;
}

function primitiveTypeName(databaseType: import('../../../../types/upstream/databaseVocabulary').DatabaseType): string {
    switch (databaseType.kind) {
        case 'integer': return 'bigint';
        case 'decimal': return 'decimal';
        case 'string': return 'varchar';
        case 'text': return 'text';
        case 'boolean': return 'boolean';
        case 'date_time': return 'timestamp';
        case 'json': return 'json';
        case 'enum': return 'enum';
    }
}

function domainColumnType(databaseType: import('../../../../types/upstream/databaseVocabulary').DatabaseType): import('../../../../types/domain/modelContracts').DatabaseColumnType {
    switch (databaseType.kind) {
        case 'integer': return { kind: 'bigint' };
        case 'decimal': return { kind: 'decimal' };
        case 'string': return { kind: 'string' };
        case 'text': return { kind: 'text' };
        case 'boolean': return { kind: 'boolean' };
        case 'date_time': return { kind: 'timestamp' };
        case 'json': return { kind: 'json' };
        case 'enum': return { kind: 'enum', values: databaseType.values.items.kind === 'empty' ? [] : sequenceValues(databaseType.values.items) };
    }
}

function sequenceValues(sequence: import('../../../../types/upstream/collections').Sequence<import('../../../../types/upstream/valueObjects').StringValue>): readonly string[] {
    const values: string[] = [];
    let current = sequence;
    while (current.kind === 'cons') {
        values.push(current.head.value);
        current = current.tail;
    }
    return values;
}

function domainNullability(value: import('../../../../types/upstream/primitiveVocabulary').Nullability): import('../../../../types/domain/modelContracts').Nullability {
    return value.kind === 'nullable' ? { kind: 'nullable' } : { kind: 'non_nullable' };
}

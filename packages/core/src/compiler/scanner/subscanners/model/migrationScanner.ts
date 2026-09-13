/**
 * migrationScanner.ts
 *
 * Scans database/migrations/*.php for table schemas and column definitions.
 *
 * @module core/compiler/scanner/subscanners/model/migrationScanner
 */

import path from "path";
import fs from "fs-extra";
import type { ParsedColumn } from "../../../../types/route";
import { LaravelSourceLexer, type TokenDescriptor } from "../../LaravelSourceLexer";
import { ScannedModelColumnDescriptor } from "../../descriptors/modelDescriptors";
import { collectPhpFiles } from "../scannerUtils";

/**
 * Scans migration files in the project to build a map of table name to column definitions.
 */
export async function scanMigrations(projectRoot: string): Promise<Map<string, ParsedColumn[]>> {
    const migrationMap = new Map<string, ParsedColumn[]>();
    const migrationDir = path.join(projectRoot, 'database', 'migrations');
    const files = await collectPhpFiles(migrationDir);

    for (const fullPath of files) {
        const source = await fs.readFile(fullPath, 'utf-8');
        const tokens = LaravelSourceLexer.tokenize(source);
        parseMigrationTokens(tokens, migrationMap);
    }

    return migrationMap;
}

/**
 * Parses tokens from a migration file and populates the migration map.
 */
export function parseMigrationTokens(
    tokens: readonly TokenDescriptor[],
    migrationMap: Map<string, ParsedColumn[]>
): void {
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].value === 'Schema' && tokens[i + 1]?.value === '::' && (tokens[i + 2]?.value === 'create' || tokens[i + 2]?.value === 'table') && tokens[i + 3]?.value === '(') {
            const tableToken = tokens[i + 4];
            if (!tableToken || tableToken.type !== 'STRING') continue;
            const tableName = tableToken.value;

            let k = i + 5;
            while (k < tokens.length && tokens[k].value !== '{') k++;
            if (tokens[k]?.value === '{') {
                const cols: ParsedColumn[] = migrationMap.get(tableName) || [];
                let depth = 1;
                k++;
                while (k < tokens.length && depth > 0) {
                    if (tokens[k].value === '{') depth++;
                    else if (tokens[k].value === '}') depth--;

                    if (tokens[k].value === '$table' && (tokens[k + 1]?.value === '->' || tokens[k + 1]?.value === '?->')) {
                        const typeMethod = tokens[k + 2]?.value;
                        if (typeMethod && tokens[k + 3]?.value === '(') {
                            if (typeMethod === 'id') {
                                const colName = tokens[k + 4]?.type === 'STRING' ? tokens[k + 4].value : 'id';
                                cols.push(ScannedModelColumnDescriptor.fromSchema({ name: colName, type: 'bigint unsigned', nullable: false }));
                            } else if (typeMethod === 'timestamps') {
                                cols.push(
                                    ScannedModelColumnDescriptor.fromSchema({ name: 'created_at', type: 'timestamp', nullable: true }),
                                    ScannedModelColumnDescriptor.fromSchema({ name: 'updated_at', type: 'timestamp', nullable: true })
                                );
                            } else if (typeMethod === 'softDeletes') {
                                cols.push(ScannedModelColumnDescriptor.fromSchema({ name: 'deleted_at', type: 'timestamp', nullable: true }));
                            } else if (tokens[k + 4]?.type === 'STRING') {
                                const colName = tokens[k + 4].value;
                                let isNullable = false;
                                let look = k + 5;
                                while (look < tokens.length && tokens[look].value !== ';') {
                                    if (tokens[look].value === 'nullable') {
                                        isNullable = true;
                                        break;
                                    }
                                    look++;
                                }

                                let colType = 'varchar';
                                let enumValues: string[] | undefined = undefined;
                                switch (typeMethod) {
                                    case 'string': colType = 'varchar'; break;
                                    case 'text':
                                    case 'longText':
                                    case 'mediumText': colType = 'text'; break;
                                    case 'integer':
                                    case 'unsignedInteger':
                                    case 'tinyInteger':
                                    case 'smallInteger': colType = 'int'; break;
                                    case 'bigInteger':
                                    case 'unsignedBigInteger':
                                    case 'foreignId': colType = 'bigint unsigned'; break;
                                    case 'decimal':
                                    case 'float':
                                    case 'double': colType = 'decimal'; break;
                                    case 'boolean': colType = 'boolean'; break;
                                    case 'timestamp':
                                    case 'dateTime':
                                    case 'date': colType = 'timestamp'; break;
                                    case 'json':
                                    case 'jsonb': colType = 'json'; break;
                                    case 'enum': {
                                        colType = 'enum';
                                        enumValues = [];
                                        let p = k + 5;
                                        while (p < tokens.length && tokens[p].value !== '[' && tokens[p].value !== ';') p++;
                                        if (tokens[p]?.value === '[') {
                                            p++;
                                            while (p < tokens.length && tokens[p].value !== ']' && tokens[p].value !== ';') {
                                                if (tokens[p].type === 'STRING') {
                                                    enumValues.push(tokens[p].value);
                                                }
                                                p++;
                                            }
                                        }
                                        break;
                                    }
                                    default: colType = 'varchar'; break;
                                }

                                cols.push(ScannedModelColumnDescriptor.fromSchema({ name: colName, type: colType, nullable: isNullable, enumValues }));
                            }
                        }
                    }
                    k++;
                }
                migrationMap.set(tableName, cols);
            }
        }
    }
}

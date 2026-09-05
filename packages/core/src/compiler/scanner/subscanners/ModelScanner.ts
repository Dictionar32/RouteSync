/**
 * ModelScanner.ts
 *
 * Scans app/Models/*.php and database/migrations/*.php for Eloquent models, migrations, casts, accessors, and relations.
 *
 * @module core/compiler/scanner/subscanners/ModelScanner
 */

import path from "path";
import fs from "fs-extra";
import {
    ParsedModel,
    ParsedColumn,
    ParsedCast,
    ParsedAccessor,
    ParsedRelation,
    EloquentRelationClassifier
} from "../../../types/route";
import { PrimitiveKind } from "../../types/SemanticType";
import { LaravelSourceLexer } from "../LaravelSourceLexer";
import {
    inferLaravelTableName,
    extractClassBasename
} from "../../../utils/resource-naming";
import {
    ScannedModelDescriptor,
    ScannedModelColumnDescriptor,
    ScannedModelCastDescriptor,
    ScannedModelAccessorDescriptor,
    ScannedModelRelationDescriptor
} from "../descriptors/modelDescriptors";
import { collectPhpFiles } from "./scannerUtils";

export class ModelScanner {
    public static async scan(projectRoot: string): Promise<readonly ParsedModel[]> {
        const modelDir = path.join(projectRoot, 'app', 'Models');
        const files = await collectPhpFiles(modelDir);
        const migrationMap = await ModelScanner.scanMigrations(projectRoot);
        const models: ParsedModel[] = [];

        for (const fullPath of files) {
            const modelName = path.basename(fullPath, '.php');
            const source = await fs.readFile(fullPath, 'utf-8');
            models.push(ModelScanner.parseModelFile(source, modelName, migrationMap));
        }

        return models;
    }

    public static async scanMigrations(projectRoot: string): Promise<Map<string, ParsedColumn[]>> {
        const migrationMap = new Map<string, ParsedColumn[]>();
        const migrationDir = path.join(projectRoot, 'database', 'migrations');
        const files = await collectPhpFiles(migrationDir);

        for (const fullPath of files) {
            const source = await fs.readFile(fullPath, 'utf-8');
            const tokens = LaravelSourceLexer.tokenize(source);

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

        return migrationMap;
    }

    public static parseModelFile(source: string, modelName: string, migrationMap?: Map<string, ParsedColumn[]>): ParsedModel {
        const tokens = LaravelSourceLexer.tokenize(source);
        let table = inferLaravelTableName(modelName);
        let primaryKey = 'id';
        let keyType = 'int';
        let incrementing = true;
        let fillable: string[] = [];
        let guarded: string[] = ['*'];
        let hidden: string[] = [];
        let appends: string[] = [];
        const castsMap: Record<string, string> = {};
        const casts: ParsedCast[] = [];
        const accessors: ParsedAccessor[] = [];
        const relations: ParsedRelation[] = [];

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            // $table = 'custom_table';
            if (token.value === '$table' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
                table = tokens[i + 2].value;
            }

            // $primaryKey = 'custom_id';
            if (token.value === '$primaryKey' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
                primaryKey = tokens[i + 2].value;
            }

            // $keyType = 'string';
            if (token.value === '$keyType' && tokens[i + 1]?.value === '=' && tokens[i + 2]?.type === 'STRING') {
                keyType = tokens[i + 2].value;
            }

            // $incrementing = false;
            if (token.value === '$incrementing' && tokens[i + 1]?.value === '=') {
                incrementing = tokens[i + 2]?.type === 'TRUE';
            }

            // $fillable = [ ... ];
            if (token.value === '$fillable' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                fillable = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $guarded = [ ... ];
            if (token.value === '$guarded' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                guarded = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $hidden = [ ... ];
            if (token.value === '$hidden' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                hidden = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $appends = [ ... ];
            if (token.value === '$appends' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                appends = parsed.entries.map(e => e.value.kind === 'literal' && e.value.literalType === 'string' ? String(e.value.value) : e.key);
            }

            // $casts = [ ... ];
            if (token.value === '$casts' && tokens[i + 1]?.value === '=') {
                const parsed = LaravelSourceLexer.parseArray(source, tokens, i + 2);
                for (const entry of parsed.entries) {
                    const castVal = entry.value.kind === 'literal' && entry.value.literalType === 'string'
                        ? String(entry.value.value)
                        : (entry.rawExpression || 'string').replace(/::class$/, '').trim();
                    castsMap[entry.key] = castVal;
                    casts.push(ScannedModelCastDescriptor.create({
                        column: entry.key,
                        targetType: castVal
                    }));
                }
            }

            // Laravel 11 style: protected function casts(): array { return [ ... ]; }
            if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER' && tokens[i + 1].value === 'casts') {
                let k = i + 2;
                while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') k++;
                if (tokens[k]?.value === '{') {
                    let depth = 1;
                    k++;
                    while (k < tokens.length && depth > 0) {
                        if (tokens[k].value === '{') depth++;
                        else if (tokens[k].value === '}') depth--;
                        if (tokens[k].value === 'return') {
                            const parsed = LaravelSourceLexer.parseArray(source, tokens, k + 1);
                            for (const entry of parsed.entries) {
                                const castVal = entry.value.kind === 'literal' && entry.value.literalType === 'string'
                                    ? String(entry.value.value)
                                    : (entry.rawExpression || 'string').replace(/::class$/, '').trim();
                                castsMap[entry.key] = castVal;
                                casts.push(ScannedModelCastDescriptor.create({
                                    column: entry.key,
                                    targetType: castVal
                                }));
                            }
                            k = Math.max(k, parsed.endIndex - 1);
                        }
                        k++;
                    }
                }
            }

            // Accessors:
            // 1. Legacy style: public function getSubtotalAttribute(): float { ... }
            if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER' && tokens[i + 1].value.startsWith('get') && tokens[i + 1].value.endsWith('Attribute')) {
                const fnName = tokens[i + 1].value;
                const rawName = fnName.slice(3, -9);
                const accName = rawName.charAt(0).toLowerCase() + rawName.slice(1);
                let accType = 'string';
                let k = i + 2;
                while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') {
                    if (tokens[k].value === ':') {
                        const hint = tokens[k + 1]?.value?.toLowerCase();
                        if (hint === 'float' || hint === 'int' || hint === 'integer' || hint === 'number') accType = 'number';
                        else if (hint === 'bool' || hint === 'boolean') accType = 'boolean';
                        else if (hint === 'array') accType = 'array';
                        else accType = 'string';
                    }
                    k++;
                }
                accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: accName, type: accType, nullable: false }));
            }

            // 2. Modern style: protected function amountMinor(): Attribute { return Attribute::make(get: fn () => ...); }
            if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
                const fnName = tokens[i + 1].value;
                let k = i + 2;
                let isAttribute = false;
                while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') {
                    if (tokens[k].value === ':' && tokens[k + 1]?.value === 'Attribute') {
                        isAttribute = true;
                    }
                    k++;
                }

                if (isAttribute && tokens[k]?.value === '{') {
                    let depth = 1;
                    k++;
                    let accType = 'string';
                    while (k < tokens.length && depth > 0) {
                        if (tokens[k].value === '{') depth++;
                        else if (tokens[k].value === '}') depth--;

                        if (tokens[k].value === '(' && (tokens[k + 1]?.value === 'int' || tokens[k + 1]?.value === 'integer' || tokens[k + 1]?.value === 'float') && tokens[k + 2]?.value === ')') {
                            accType = 'number';
                        }
                        k++;
                    }
                    accessors.push(ScannedModelAccessorDescriptor.fromReturnType({ name: fnName, type: accType, nullable: false }));
                }
            }

            // Relations: public function orderDetails(): HasMany { return $this->hasMany(OrderDetail::class); }
            if (token.value === 'function' && tokens[i + 1]?.type === 'IDENTIFIER') {
                const relName = tokens[i + 1].value;
                let k = i + 2;
                while (k < tokens.length && tokens[k].value !== '{' && tokens[k].value !== ';') k++;
                if (tokens[k]?.value === '{') {
                    while (k < tokens.length && tokens[k].value !== '}') {
                        if (tokens[k].value === '$this' && (tokens[k + 1]?.value === '->' || tokens[k + 1]?.value === '?->')) {
                            const relMethod = tokens[k + 2]?.value;
                            if (EloquentRelationClassifier.isRelationMethod(relMethod)) {
                                const descriptor = EloquentRelationClassifier.getDescriptor(relMethod);
                                if (tokens[k + 3]?.value === '(' && tokens[k + 4]?.type === 'IDENTIFIER') {
                                    const relatedModel = tokens[k + 4].value;
                                    const modelName = extractClassBasename(relatedModel);
                                    relations.push(ScannedModelRelationDescriptor.create({
                                        name: relName,
                                        type: descriptor.type,
                                        modelName,
                                        targetModel: relatedModel,
                                        cardinality: descriptor.cardinality,
                                        isCollection: descriptor.isCollection
                                    }));
                                }
                            }
                        }
                        k++;
                    }
                }
            }
        }

        const migrationCols = migrationMap?.get(table);
        const columns = migrationCols && migrationCols.length > 0
            ? migrationCols
            : Array.from(new Set(['id', ...fillable, 'created_at', 'updated_at'])).map(col => {
                const castEntry = casts.find(c => c.column === col);
                let primKind: PrimitiveKind = PrimitiveKind.STRING;
                if (castEntry) {
                    primKind = castEntry.semanticType;
                } else if (col === 'id' || col.endsWith('_id') || col.endsWith('Id')) {
                    primKind = PrimitiveKind.NUMBER;
                } else if (col.endsWith('_at')) {
                    primKind = PrimitiveKind.DATETIME;
                }

                let colType = 'varchar';
                if (primKind === PrimitiveKind.NUMBER) {
                    colType = 'int';
                } else if (primKind === PrimitiveKind.BOOLEAN) {
                    colType = 'boolean';
                } else if (primKind === PrimitiveKind.DATETIME) {
                    colType = 'timestamp';
                }

                return ScannedModelColumnDescriptor.fromSchema({
                    name: col,
                    type: colType,
                    nullable: col !== 'id',
                    semanticType: primKind
                });
            });

        return ScannedModelDescriptor.create({
            name: modelName,
            shortName: modelName,
            table,
            primaryKey,
            keyType,
            incrementing,
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

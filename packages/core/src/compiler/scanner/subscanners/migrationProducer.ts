import type { MigrationAst } from '../../../types/upstream/ast';
import type { ColumnDefinition, DatabaseType, ForeignKeyAction, ForeignKey, IndexDefinition } from '../../../types/upstream/databaseVocabulary';
import type { MigrationOperation } from '../../../types/upstream/migration';
import type { Sequence } from '../../../types/upstream/collections';
import type { PrimitiveVocabulary, Presence, Nullability } from '../../../types/upstream/primitiveVocabulary';
import type { SourceSpan } from '../../../types/upstream/provenance';
import type { SourceFile, TableName, DomainTypeName } from '../../../types/upstream/names';
import { createColumnName, createIndexName, createTableName } from '../../../types/domain/modelValueFactories';
import type { TokenDescriptor } from '../LaravelSourceLexer';
import type { PhpMethodAst } from '../lexer/phpMethodAstTypes';
import { relationAny, relationAll, relationEqual, relationGate } from '../../../semantic/kernel/semanticRelations';
import {
    RELATION_NONE,
    relationAdvanceIndex,
    relationFirstOption,
    relationOptionFold,
    relationProject,
    relationSome,
    relationTextSlice,
    type RelationOption,
} from '../../../semantic/kernel/relationalSequence';

export type MigrationSourceAst = {
    readonly kind: 'migration_source_ast';
    readonly methods: readonly PhpMethodAst[];
    readonly tokens: readonly TokenDescriptor[];
    readonly source: SourceSpan;
};

export type MigrationProducerInput = {
    readonly source: MigrationSourceAst;
    readonly file: SourceFile;
    readonly sourceSpan: SourceSpan;
};

export interface MigrationProducer {
    readonly produce: (input: MigrationProducerInput) => MigrationAst;
}

const seq = <T>(items: readonly T[], index = 0): Sequence<T> =>
    relationGate(
        relationEqual(index, items.length),
        () => ({ kind: 'empty' }),
        () => ({ kind: 'cons', head: items[index], tail: seq(items, relationAdvanceIndex(index, 1)) }),
    );

const primitive = (kind: PrimitiveVocabulary['kind']): PrimitiveVocabulary => ({ kind });
const nullability = (nullable: boolean): Nullability => relationGate(nullable, () => ({ kind: 'nullable' }), () => ({ kind: 'non_nullable' }));
const presence: Presence = { kind: 'required' };
const truth = (value: boolean) => ({ kind: 'truth_value' as const, value });

function source(file: string, line = 0): SourceSpan {
    return { kind: 'source_span', file: { kind: 'source_file', value: { kind: 'string_value', value: file } }, start: { kind: 'number_value', value: line }, end: { kind: 'number_value', value: line } };
}

const tokenOption = (tokens: readonly TokenDescriptor[], index: number): RelationOption<TokenDescriptor> =>
    relationGate(index < tokens.length, () => relationSome(tokens[index]), () => ({ kind: 'none' }));

const tokenValue = (tokens: readonly TokenDescriptor[], index: number): RelationOption<string> =>
    relationOptionFold(tokenOption(tokens, index), () => ({ kind: 'none' }), token => relationSome(token.value));

const tokenType = (tokens: readonly TokenDescriptor[], index: number): RelationOption<string> =>
    relationOptionFold(tokenOption(tokens, index), () => ({ kind: 'none' }), token => relationSome(token.type));

const tokenIs = (tokens: readonly TokenDescriptor[], index: number, value: string): boolean =>
    relationOptionFold(tokenValue(tokens, index), () => false, actual => relationEqual(actual, value));

const tokenIsType = (tokens: readonly TokenDescriptor[], index: number, type: string): boolean =>
    relationOptionFold(tokenType(tokens, index), () => false, actual => relationEqual(actual, type));

function databaseType(method: string): DatabaseType {
    const candidates: readonly { readonly names: readonly string[]; readonly value: DatabaseType }[] = Object.freeze([
        { names: ['boolean'], value: { kind: 'boolean' } },
        { names: ['json', 'jsonb'], value: { kind: 'json' } },
        { names: ['text', 'longText', 'mediumText'], value: { kind: 'text' } },
        { names: ['timestamp', 'dateTime', 'date'], value: { kind: 'date_time' } },
        { names: ['decimal', 'float', 'double'], value: { kind: 'decimal', precision: { kind: 'number_value', value: 0 }, scale: { kind: 'number_value', value: 0 } } },
        { names: ['id', 'bigInteger', 'unsignedBigInteger', 'foreignId'], value: { kind: 'integer', width: { kind: 'big' }, signed: truth(relationAny([relationEqual(method.startsWith('unsigned'), false), relationEqual(method, 'foreignId')])) } },
        { names: ['integer', 'unsignedInteger'], value: { kind: 'integer', width: { kind: 'normal' }, signed: truth(relationEqual(method.startsWith('unsigned'), false)) } },
        { names: ['tinyInteger', 'unsignedTinyInteger'], value: { kind: 'integer', width: { kind: 'tiny' }, signed: truth(relationEqual(method.startsWith('unsigned'), false)) } },
        { names: ['smallInteger', 'unsignedSmallInteger'], value: { kind: 'integer', width: { kind: 'small' }, signed: truth(relationEqual(method.startsWith('unsigned'), false)) } },
    ]);
    const hit = relationFirstOption(candidates, candidate => relationAny(relationProject(candidate.names, name => relationEqual(name, method))));
    return relationOptionFold(hit, () => ({ kind: 'string', length: { kind: 'number_value', value: 255 } }), candidate => candidate.value);
}

function column(method: string, name: string, nullable: boolean, primary: boolean, file: string, line: number): ColumnDefinition {
    const database = databaseType(method);
    const semantic = relationGate(
        relationEqual(database.kind, 'boolean'),
        () => primitive('boolean'),
        () => relationGate(
            relationEqual(database.kind, 'json'),
            () => primitive('json'),
            () => relationGate(
                relationEqual(database.kind, 'date_time'),
                () => primitive('date_time'),
                () => relationGate(
                    relationAny([relationEqual(database.kind, 'integer'), relationEqual(database.kind, 'decimal')]),
                    () => primitive('number'),
                    () => primitive('string'),
                ),
            ),
        ),
    );
    return { kind: 'column', name: createColumnName(name), databaseType: database, semanticType: semantic, presence, nullability: nullability(nullable), default: { kind: 'none' }, primary: truth(relationAny([relationEqual(method, 'id'), primary])), autoGenerated: truth(relationEqual(method, 'id')), source: source(file, line) };
}

type IndexArguments = { readonly columns: readonly string[]; readonly name: RelationOption<string> };

function collectIndexArguments(tokens: readonly TokenDescriptor[], start: number): IndexArguments {
    const scanOpening = (cursor: number): RelationOption<number> =>
        relationGate(
            relationAny([relationEqual(cursor, tokens.length), tokenIs(tokens, cursor, '('), tokenIs(tokens, cursor, ';')]),
            () => relationGate(tokenIs(tokens, cursor, '('), () => relationSome(cursor), () => ({ kind: 'none' })),
            () => scanOpening(relationAdvanceIndex(cursor, 1)),
        );
    const opening = scanOpening(start);
    return relationOptionFold(
        opening,
        () => ({ columns: Object.freeze([]), name: { kind: 'none' } }),
        cursor => {
            const visit = (position: number, depth: number, sawArray: boolean, arrayClosed: boolean, columns: readonly string[], explicitName: RelationOption<string>): IndexArguments =>
                relationGate(
                    relationAny([relationEqual(position, tokens.length), tokenIs(tokens, position, ';')]),
                    () => ({ columns, name: explicitName }),
                    () => {
                        const value = relationOptionFold(tokenValue(tokens, position), () => '', actual => actual);
                        const openingArray = relationEqual(value, '[');
                        const closingArray = relationEqual(value, ']');
                        const nextDepth = relationGate(openingArray, () => depth + 1, () => relationGate(closingArray, () => Math.max(0, depth - 1), () => depth));
                        const nextSawArray = relationAny([sawArray, openingArray]);
                        const nextClosed = relationAny([arrayClosed, closingArray]);
                        const stringToken = tokenIsType(tokens, position, 'STRING');
                        const columnCondition = relationAll([stringToken, relationAny([relationEqual(depth > 0, true), relationAll([relationEqual(sawArray, false), relationEqual(columns.length, 0)])])]);
                        const nextColumns = relationGate(columnCondition, () => [...columns, value], () => columns);
                        const nameCondition = relationAll([stringToken, relationOptionFold(explicitName, () => true, () => false), relationAny([relationEqual(sawArray, false), arrayClosed])]);
                        const nextName = relationGate(nameCondition, () => relationSome(value), () => explicitName);
                        return visit(relationAdvanceIndex(position, 1), nextDepth, nextSawArray, nextClosed, nextColumns, nextName);
                    },
                );
            return visit(relationAdvanceIndex(cursor, 1), 0, false, false, Object.freeze([]), { kind: 'none' });
        },
    );
}

const tokenStrings = (tokens: readonly TokenDescriptor[], start: number, limit: number, index = start, output: readonly string[] = Object.freeze([])): readonly string[] =>
    relationGate(
        relationAny([relationEqual(index, tokens.length), relationEqual(index, limit), tokenIs(tokens, index, ';')]),
        () => output,
        () => relationGate(tokenIsType(tokens, index, 'STRING'), () => tokenStrings(tokens, start, limit, relationAdvanceIndex(index, 1), [...output, tokens[index].value]), () => tokenStrings(tokens, start, limit, relationAdvanceIndex(index, 1), output)),
    );

const findBodyOpen = (tokens: readonly TokenDescriptor[], index: number): RelationOption<number> =>
    relationGate(
        relationAny([relationEqual(index, tokens.length), tokenIs(tokens, index, '{')]),
        () => relationGate(tokenIs(tokens, index, '{'), () => relationSome(index), () => ({ kind: 'none' })),
        () => findBodyOpen(tokens, relationAdvanceIndex(index, 1)),
    );

const chainFlags = (tokens: readonly TokenDescriptor[], start: number, limit: number, index = start, state = { nullable: false, primary: false, unique: false, index: false }): typeof state =>
    relationGate(
        relationAny([relationEqual(index, tokens.length), relationEqual(index, limit), tokenIs(tokens, index, ';')]),
        () => state,
        () => chainFlags(tokens, start, limit, relationAdvanceIndex(index, 1), {
            nullable: relationAny([state.nullable, tokenIs(tokens, index, 'nullable')]),
            primary: relationAny([state.primary, tokenIs(tokens, index, 'primary')]),
            unique: relationAny([state.unique, tokenIs(tokens, index, 'unique')]),
            index: relationAny([state.index, tokenIs(tokens, index, 'index')]),
        }),
    );

function createColumnItems(tokens: readonly TokenDescriptor[], file: string, start: number, index = start, output: readonly ColumnDefinition[] = Object.freeze([]), indexes: readonly IndexDefinition[] = Object.freeze([])): { readonly columns: readonly ColumnDefinition[]; readonly indexes: readonly IndexDefinition[] } {
    return relationGate(
        relationAny([relationEqual(index, tokens.length), tokenIs(tokens, index, '}')]),
        () => ({ columns: output, indexes }),
        () => relationGate(
            relationAll([tokenIs(tokens, index, '$table'), relationAny([tokenIs(tokens, relationAdvanceIndex(index, 1), '->'), tokenIs(tokens, relationAdvanceIndex(index, 1), '?->')])]),
            () => {
                const method = tokens[relationAdvanceIndex(index, 2)].value;
                const nameOption = relationGate(tokenIsType(tokens, relationAdvanceIndex(index, 4), 'STRING'), () => relationSome(tokens[relationAdvanceIndex(index, 4)].value), () => relationGate(relationEqual(method, 'id'), () => relationSome('id'), () => ({ kind: 'none' })));
                const flags = chainFlags(tokens, relationAdvanceIndex(index, 5), Math.min(tokens.length, relationAdvanceIndex(index, 30)));
                const special = relationAny([relationEqual(method, 'timestamps'), relationEqual(method, 'softDeletes')]);
                const nextOutput = relationGate(
                    special,
                    () => relationGate(relationEqual(method, 'timestamps'), () => [...output, column('timestamp', 'created_at', true, false, file, tokens[index].line), column('timestamp', 'updated_at', true, false, file, tokens[index].line)], () => [...output, column('timestamp', 'deleted_at', true, false, file, tokens[index].line)]),
                    () => relationOptionFold(nameOption, () => output, name => [...output, column(method, name, flags.nullable, flags.primary, file, tokens[index].line)]),
                );
                const nextIndexes = relationGate(
                    relationAll([relationEqual(method, 'foreignId'), false]),
                    () => indexes,
                    () => relationOptionFold(nameOption, () => indexes, name => relationGate(relationAny([flags.unique, flags.index]), () => [...indexes, { kind: 'index', columns: { kind: 'column_names', items: seq([createColumnName(name)]) }, unique: truth(flags.unique), name: createIndexName(`${tokens[relationAdvanceIndex(index, 4)].value}_${name}_${relationGate(flags.unique, () => 'unique', () => 'index')}`), source: source(file, tokens[index].line) }], () => indexes)),
                );
                return createColumnItems(tokens, file, start, relationAdvanceIndex(index, 1), nextOutput, nextIndexes);
            },
            () => createColumnItems(tokens, file, start, relationAdvanceIndex(index, 1), output, indexes),
        ),
    );
}

function createRelationItems(tokens: readonly TokenDescriptor[], file: string, table: string, start: number, index = start, indexes: readonly IndexDefinition[] = Object.freeze([]), foreignKeys: readonly ForeignKey[] = Object.freeze([])): { readonly indexes: readonly IndexDefinition[]; readonly foreignKeys: readonly ForeignKey[] } {
    return relationGate(
        relationAny([relationEqual(index, tokens.length), tokenIs(tokens, index, '}')]),
        () => ({ indexes, foreignKeys }),
        () => relationGate(
            relationAll([tokenIs(tokens, index, '$table'), relationAny([tokenIs(tokens, relationAdvanceIndex(index, 1), '->'), tokenIs(tokens, relationAdvanceIndex(index, 1), '?->')])]),
            () => {
                const method = tokens[relationAdvanceIndex(index, 2)].value;
                const args = tokenStrings(tokens, relationAdvanceIndex(index, 3), Math.min(tokens.length, relationAdvanceIndex(index, 30)));
                const span = source(file, tokens[index].line);
                const parsedIndex = collectIndexArguments(tokens, relationAdvanceIndex(index, 3));
                const nextIndexes = relationGate(
                    relationAny([relationEqual(method, 'unique'), relationEqual(method, 'index')]),
                    () => relationGate(parsedIndex.columns.length > 0, () => [...indexes, { kind: 'index', columns: { kind: 'column_names', items: seq(relationProject(parsedIndex.columns, value => createColumnName(value))) }, unique: truth(relationEqual(method, 'unique')), name: createIndexName(relationOptionFold(parsedIndex.name, () => `${table}_${parsedIndex.columns.join('_')}_${method}`, value => value)), source: span }], () => indexes),
                    () => indexes,
                );
                const nextForeignKeys = relationGate(
                    relationEqual(method, 'foreignId'),
                    () => relationOptionFold(relationGate(args.length > 0, () => relationSome(args[0]), () => ({ kind: 'none' })), () => foreignKeys, columnName => {
                        const constrained = tokenIs(tokens, relationAdvanceIndex(index, 4), 'constrained');
                        const deleteAction = relationGate(tokenIs(tokens, relationAdvanceIndex(index, 4), 'cascadeOnDelete'), () => ({ kind: 'cascade' as const }), () => relationGate(tokenIs(tokens, relationAdvanceIndex(index, 4), 'nullOnDelete'), () => ({ kind: 'set_null' as const }), () => relationGate(tokenIs(tokens, relationAdvanceIndex(index, 4), 'restrictOnDelete'), () => ({ kind: 'restrict' as const }), () => ({ kind: 'no_action' as const }))));
                        return relationGate(constrained, () => {
                            const constrainedIndex = relationFirstOption(relationProject(tokenStrings(tokens, relationAdvanceIndex(index, 3), Math.min(tokens.length, relationAdvanceIndex(index, 40))), value => value), value => relationEqual(value, 'constrained'));
                            const target = relationOptionFold(constrainedIndex, () => '', value => value);
                            const base = relationGate(columnName.endsWith('_id'), () => relationTextSlice(columnName, 0, relationAdvanceIndex(columnName.length, -3)), () => columnName);
                            const targetTable = relationGate(target.length > 0, () => target, () => `${base}s`);
                            return [...foreignKeys, { kind: 'foreign_key', column: createColumnName(columnName), referencesModel: { kind: 'domain_type_name', value: { kind: 'string_value', value: targetTable } }, referencesColumn: createColumnName('id'), onDelete: deleteAction, onUpdate: { kind: 'no_action' }, source: span }];
                        }, () => foreignKeys);
                    }),
                    () => relationGate(
                        relationEqual(method, 'foreign'),
                        () => relationGate(args.length > 0, () => {
                            const referencesColumn = relationOptionFold(relationFirstOption(tokenStrings(tokens, relationAdvanceIndex(index, 3), Math.min(tokens.length, relationAdvanceIndex(index, 40))), value => relationEqual(value, 'references')), () => 'id', value => value);
                            const referencesTable = relationOptionFold(relationFirstOption(tokenStrings(tokens, relationAdvanceIndex(index, 3), Math.min(tokens.length, relationAdvanceIndex(index, 40))), value => relationEqual(value, 'on')), () => '', value => value);
                            const onDelete = relationGate(tokenIs(tokens, relationAdvanceIndex(index, 4), 'cascadeOnDelete'), () => ({ kind: 'cascade' as const }), () => relationGate(tokenIs(tokens, relationAdvanceIndex(index, 4), 'nullOnDelete'), () => ({ kind: 'set_null' as const }), () => relationGate(tokenIs(tokens, relationAdvanceIndex(index, 4), 'restrictOnDelete'), () => ({ kind: 'restrict' as const }), () => ({ kind: 'no_action' as const }))));
                            return relationGate(referencesTable.length > 0, () => [...foreignKeys, { kind: 'foreign_key', column: createColumnName(args[0]), referencesModel: { kind: 'domain_type_name', value: { kind: 'string_value', value: referencesTable } }, referencesColumn: createColumnName(referencesColumn), onDelete, onUpdate: { kind: 'no_action' }, source: span }], () => foreignKeys);
                        }, () => foreignKeys),
                        () => foreignKeys,
                    ),
                );
                return createRelationItems(tokens, file, table, start, relationAdvanceIndex(index, 1), nextIndexes, nextForeignKeys);
            },
            () => createRelationItems(tokens, file, table, start, relationAdvanceIndex(index, 1), indexes, foreignKeys),
        ),
    );
}

function createOperations(tokens: readonly TokenDescriptor[], file: string, index = 0, output: readonly MigrationOperation[] = Object.freeze([])): readonly MigrationOperation[] {
    return relationGate(
        relationEqual(index + 4, tokens.length),
        () => output,
        () => relationGate(
            relationAll([tokenIs(tokens, index, 'Schema'), tokenIs(tokens, relationAdvanceIndex(index, 1), '::'), relationAny([tokenIs(tokens, relationAdvanceIndex(index, 2), 'create'), tokenIs(tokens, relationAdvanceIndex(index, 2), 'table')]), tokenIsType(tokens, relationAdvanceIndex(index, 4), 'STRING')]),
            () => {
                const table = tokens[relationAdvanceIndex(index, 4)];
                const opening = findBodyOpen(tokens, relationAdvanceIndex(index, 5));
                return relationOptionFold(opening, () => createOperations(tokens, file, relationAdvanceIndex(index, 1), output), body => {
                    const columnItems = createColumnItems(tokens, file, body);
                    const relations = createRelationItems(tokens, file, table.value, body);
                    const operation: MigrationOperation = { kind: 'create_table', table: createTableName(table.value), columns: { kind: 'columns', items: seq(columnItems.columns) }, indexes: { kind: 'indexes', items: seq([...columnItems.indexes, ...relations.indexes]) }, foreignKeys: { kind: 'foreign_keys', items: seq(relations.foreignKeys) } };
                    return createOperations(tokens, file, relationAdvanceIndex(index, 1), [...output, operation]);
                });
            },
            () => createOperations(tokens, file, relationAdvanceIndex(index, 1), output),
        ),
    );
}

export const migrationProducer: MigrationProducer = {
    produce: (input) => {
        const operations = createOperations(input.source.tokens, input.file.value.value);
        return {
            kind: 'migration_ast',
            definition: {
                kind: 'migration_definition',
                file: input.file,
                operations: { kind: 'migration_operations', items: seq(operations) },
                source: input.sourceSpan,
            },
            source: input.sourceSpan,
        };
    },
};

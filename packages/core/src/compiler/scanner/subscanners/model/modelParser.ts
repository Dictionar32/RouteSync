/**
 * modelParser.ts
 *
 * Builds the canonical model semantic definition from repository PHP AST nodes
 * and already-produced semantic member values.
 *
 * Tokenization and PHP syntax recognition stay below this boundary in
 * ModelScanner. This module does not re-scan source text or classify tokens.
 */

import type { MigrationAst } from "../../../../types/upstream/ast";
import type { ColumnDefinition } from "../../../../types/upstream/databaseVocabulary";
import { inferLaravelTableName } from "../../../../utils/resource-naming";
import { buildModelSemanticDefinition } from "../../descriptors/modelDescriptors";
import type { ModelKeyKind, ModelKeySemanticType } from "../../../../types/upstream/model";
import { createColumnName, createModelName, createPropertyName, createTableName } from "../../../../types/upstream/names";
import type { ModelAccessorFact, ModelRelationFact } from "../../../../types/upstream/modelSourceFacts";
import type { ModelCast } from "../../../../types/upstream/model";
import type { ModelSemanticDefinition } from "../../../../types/upstream/model";
import type { PhpClassPropertyAst, ModelDeclarationAst } from "../../lexer";
import { applyModelPropertyAst } from "./memberPropertiesParser";
import { resolveModelColumns } from "./columnInferrer";
import { buildModelColumnFacts } from "./modelColumnFactsCanonical";
import { correlateModelColumnFacts } from "./modelColumnOrigin";
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { StringValue, NumberValue } from '../../../../types/upstream/valueObjects';


const modelKeySemanticType = (keyType: ModelKeyKind): ModelKeySemanticType => {
    const semanticTypes: { readonly [K in ModelKeyKind['kind']]: ModelKeySemanticType } = {
        integer: { kind: 'number' },
        big_integer: { kind: 'number' },
        string: { kind: 'string' },
        uuid: { kind: 'string' },
        ulid: { kind: 'string' }
    };
    return semanticTypes[keyType.kind];
};

function inferKeyTypeFromSchema(columns: import("../../../../types/upstream/collections").Columns, primaryKey: import("../../../../types/upstream/names").ColumnName): ModelKeyKind {
    let items = columns.items;
    while (items.kind === 'cons') {
        const column: ColumnDefinition = items.head;
        if (column.name.value.value === primaryKey.value.value) {
            if (column.databaseType.kind === 'integer') return column.databaseType.width.kind === 'big' ? { kind: 'big_integer' } : { kind: 'integer' };
            if (column.databaseType.kind === 'string') return { kind: 'string' };
        }
        items = items.tail;
    }
    throw new Error(`Model boundary violation: primary key schema for "${primaryKey.value.value}" was not found or has unsupported database type.`);
}

/**
 * Canonical semantic model owner built exclusively from AST/ADT-derived inputs.
 * The eight Laravel model properties are consumed through PhpClassPropertyAst.
 */
export function buildModelSemanticDefinitionFromAst(
    source: string,
    modelName: string,
    migrations: readonly MigrationAst[],
    propertyAsts: readonly PhpClassPropertyAst[],
    declaration: ModelDeclarationAst,
    casts: readonly ModelCast[],
    accessors: readonly ModelAccessorFact[],
    relations: readonly ModelRelationFact[],
    file: string = modelName
): ModelSemanticDefinition {
    const defaultTable = inferLaravelTableName(modelName);
    const propState = {
        table: createTableName(defaultTable),
        primaryKey: createColumnName('id'),
        keyType: { kind: 'not_declared' },
        incrementing: true,
        fillable: [] as ReturnType<typeof createPropertyName>[],
        guarded: [createPropertyName('*')],
        hidden: [] as ReturnType<typeof createPropertyName>[],
        appends: [] as ReturnType<typeof createPropertyName>[]
    };

    for (const property of propertyAsts) applyModelPropertyAst(property, propState);

    const columns = resolveModelColumns(propState.table, migrations);
    const keyType = propState.keyType.kind === 'declared' ? propState.keyType.value : inferKeyTypeFromSchema(columns, propState.primaryKey);
    const text = (value: string): StringValue => ({ kind: 'string_value', value });
    const number = (value: number): NumberValue => ({ kind: 'number_value', value });
    const span: SourceSpan = {
        kind: 'source_span',
        file: { kind: 'source_file', value: text(file) },
        start: number(0),
        end: number(source.length)
    };

    return buildModelSemanticDefinition({
        identity: {
            name: createModelName(modelName),
            shortName: createModelName(modelName),
            table: propState.table,
            primaryKey: propState.primaryKey
        },
        key: {
            type: keyType,
            semanticType: modelKeySemanticType(keyType)
        },
        behavior: { incrementing: propState.incrementing, softDeletes: false, timestamps: true },
        exposure: {
            fillable: propState.fillable,
            guarded: propState.guarded,
            hidden: propState.hidden,
            appends: propState.appends
        },
        columnFacts: buildModelColumnFacts(correlateModelColumnFacts(columns, casts, span), span),
        casts: [...casts],
        accessors: [...accessors],
        relations: [...relations]
    });
}

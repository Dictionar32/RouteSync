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
import { mapResourcePhpAstToUpstream } from '../resource/resourceUpstreamExpressionCanonical';
import type { ModelAccessorFact } from "../../../../types/upstream/modelSourceFacts";
import type { ModelInheritance, ModelMethod, ModelConstant, ModelSourceCapabilities } from '../../../../types/upstream/model';
import type { ClassName, ConstantName, MethodName, TraitName } from '../../../../types/upstream/names';
import type { Sequence } from '../../../../types/upstream/collections';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { PhpAstValue } from '../../lexer/PhpAst';
import type { EloquentRelationAst } from "../../../../types/upstream/eloquent";
import type { ModelCast } from "../../../../types/upstream/model";
import type { ModelSemanticDefinition } from "../../../../types/upstream/model";
import type { PhpClassPropertyAst, ModelDeclarationAst } from "../../lexer";
import { applyModelPropertyAst } from "./memberPropertiesParser";
import { resolveModelColumns } from "./columnInferrer";
import { buildModelColumnFacts } from "./modelColumnFactsCanonical";
import { correlateModelColumnFacts } from "./modelColumnOrigin";
import type { SourceSpan } from '../../../../types/upstream/provenance';


const text = (value: string): StringValue => ({ kind: 'string_value', value });
const className = (value: string): ClassName => ({ kind: 'class_name', value: text(value) });
const methodName = (value: string): MethodName => ({ kind: 'method_name', value: text(value) });
const constantName = (value: string): ConstantName => ({ kind: 'constant_name', value: text(value) });
const traitName = (value: string): TraitName => ({ kind: 'trait_name', value: text(value) });
const sequence = <T>(items: readonly T[]): Sequence<T> => items.reduceRight<Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const typeFromPhpAst = (value: PhpAstValue): TypeExpression => value.kind === 'class_reference'
    ? { kind: 'reference', value: { kind: 'class', name: className(value.className.value) } }
    : { kind: 'reference', value: { kind: 'class', name: className('mixed') } };

export function produceModelSourceSemantics(declaration: ModelDeclarationAst, source: SourceSpan): {
    readonly inheritance: ModelInheritance;
    readonly capabilities: ModelSourceCapabilities;
    readonly methods: readonly ModelMethod[];
    readonly constants: readonly ModelConstant[];
} {
    const inheritance: ModelInheritance = declaration.inheritance.kind === 'eloquent_model'
        ? { kind: 'eloquent_model' }
        : declaration.inheritance.kind === 'authenticatable'
            ? { kind: 'authenticatable' }
            : { kind: 'class', name: className(declaration.inheritance.name.value) };
    const methods: ModelMethod[] = declaration.methods.map(item => ({
        kind: 'model_method',
        name: methodName(item.name.value),
        visibility: item.visibility,
        result: item.returnType.kind === 'absent' ? { kind: 'absent' } : { kind: 'present', type: typeFromPhpAst(item.returnType.value) },
        body: { kind: 'source_statements', items: sequence(item.returns.map(returnValue => ({ kind: 'return' as const, expression: mapResourcePhpAstToUpstream(returnValue, source.file.value.value), source: { kind: 'source_span' as const, file: source.file, start: { kind: 'number_value' as const, value: Number(item.bodyStart.value) }, end: { kind: 'number_value' as const, value: Number(item.bodyEnd.value) } } }))) },
        source: { kind: 'source_span', file: source.file, start: { kind: 'number_value', value: Number(item.startOffset.value) }, end: { kind: 'number_value', value: Number(item.endOffset.value) } }
    }));
    const constants: ModelConstant[] = declaration.constants.map(item => ({
        kind: 'model_constant',
        name: constantName(item.name.value),
        visibility: item.visibility,
        value: { kind: 'expression', value: item.value, source },
        source: { kind: 'source_span', file: source.file, start: { kind: 'number_value', value: Number(item.startOffset.value) }, end: { kind: 'number_value', value: Number(item.endOffset.value) } }
    }));
    return {
        inheritance,
        capabilities: { kind: 'model_source_capabilities', traits: { kind: 'model_traits', items: sequence(declaration.traits.map(item => traitName(item.value))) } },
        methods,
        constants
    };
}

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
    sourceSpan: SourceSpan,
    migrations: readonly MigrationAst[],
    propertyAsts: readonly PhpClassPropertyAst[],
    declaration: ModelDeclarationAst,
    casts: readonly ModelCast[],
    accessors: readonly ModelAccessorFact[],
    relations: readonly EloquentRelationAst[]
): ModelSemanticDefinition {
    const sourceSemantics = produceModelSourceSemantics(declaration, sourceSpan);
    const modelName = declaration.name;
    const defaultTable = inferLaravelTableName(modelName);
    const propState = {
        table: createTableName(defaultTable),
        primaryKey: createColumnName('id'),
        keyType: { kind: 'not_declared' },
        incrementing: { value: true, origin: 'laravel_default' },
        softDeletes: { value: false, origin: 'laravel_default' },
        timestamps: { value: true, origin: 'laravel_default' },
        fillable: [] as ReturnType<typeof createPropertyName>[],
        guarded: [createPropertyName('*')],
        hidden: [] as ReturnType<typeof createPropertyName>[],
        appends: [] as ReturnType<typeof createPropertyName>[]
    };

    for (const property of propertyAsts) applyModelPropertyAst(property, propState);

    const columns = resolveModelColumns(propState.table, migrations);
    const keyType = propState.keyType.kind === 'declared' ? propState.keyType.value : inferKeyTypeFromSchema(columns, propState.primaryKey);
    const span = sourceSpan;

    return buildModelSemanticDefinition({
        inheritance: sourceSemantics.inheritance,
        capabilities: sourceSemantics.capabilities,
        methods: sourceSemantics.methods,
        constants: sourceSemantics.constants,
        identity: {
            name: createModelName(modelName),
            shortName: createModelName(modelName),
            table: propState.table,
            primaryKey: propState.primaryKey
        },
        key: {
            type: keyType,
            semanticType: modelKeySemanticType(keyType),
            origin: propertyAsts.some(property => property.name === 'primaryKey') ? { kind: 'explicit' } : { kind: 'conventional' }
        },
        behavior: {
            kind: 'model_behavior',
            incrementing: { value: { kind: 'truth_value', value: propState.incrementing.value }, origin: { kind: propState.incrementing.origin } },
            softDeletes: { value: { kind: 'truth_value', value: propState.softDeletes.value }, origin: { kind: propState.softDeletes.origin } },
            timestamps: { value: { kind: 'truth_value', value: propState.timestamps.value }, origin: { kind: propState.timestamps.origin } }
        },
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

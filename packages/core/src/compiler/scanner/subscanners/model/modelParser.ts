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
import { buildModelSemanticDefinition } from "../../semantic/model/modelSemanticDefinition";
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
import { relationEqual, relationGate } from '../../../../semantic/foundation/semanticRelations';
import { relationProject, relationFold, relationOptionFold, relationSome, relationNone, type RelationOption } from '../../../../semantic/foundation/relationalSequence';


const text = (value: string): StringValue => ({ kind: 'string_value', value });
const className = (value: string): ClassName => ({ kind: 'class_name', value: text(value) });
const methodName = (value: string): MethodName => ({ kind: 'method_name', value: text(value) });
const constantName = (value: string): ConstantName => ({ kind: 'constant_name', value: text(value) });
const traitName = (value: string): TraitName => ({ kind: 'trait_name', value: text(value) });
const sequence = <T>(items: readonly T[], index = 0): Sequence<T> => relationGate(
    relationEqual(index, items.length),
    () => ({ kind: 'empty' }),
    () => ({ kind: 'cons', head: items[index], tail: sequence(items, index + 1) }),
);
const typeFromPhpAst = (value: PhpAstValue): TypeExpression => relationGate(
    relationEqual(value.kind, 'class_reference'),
    () => ({ kind: 'reference', value: { kind: 'class', name: className(value.className.value) } }),
    () => ({ kind: 'reference', value: { kind: 'class', name: className('mixed') } }),
);

export function produceModelSourceSemantics(declaration: ModelDeclarationAst, source: SourceSpan): {
    readonly inheritance: ModelInheritance;
    readonly capabilities: ModelSourceCapabilities;
    readonly methods: readonly ModelMethod[];
    readonly constants: readonly ModelConstant[];
} {
    const inheritance: ModelInheritance = relationGate(
        relationEqual(declaration.inheritance.kind, 'eloquent_model'),
        () => ({ kind: 'eloquent_model' as const }),
        () => relationGate(
            relationEqual(declaration.inheritance.kind, 'authenticatable'),
            () => ({ kind: 'authenticatable' as const }),
            () => ({ kind: 'class' as const, name: className(declaration.inheritance.name.value) }),
        ),
    );
    const methods: ModelMethod[] = relationProject(declaration.methods, item => ({
        kind: 'model_method',
        name: methodName(item.name.value),
        visibility: item.visibility,
        result: relationGate(
            relationEqual(item.returnType.kind, 'absent'),
            () => ({ kind: 'absent' as const }),
            () => ({ kind: 'present' as const, type: typeFromPhpAst(item.returnType.value) }),
        ),
        body: { kind: 'source_statements', items: sequence(relationProject(item.returns, returnValue => ({ kind: 'return' as const, expression: mapResourcePhpAstToUpstream(returnValue, source.file.value.value), source: { kind: 'source_span' as const, file: source.file, start: { kind: 'number_value' as const, value: Number(item.bodyStart.value) }, end: { kind: 'number_value' as const, value: Number(item.bodyEnd.value) } } }))) },
        source: { kind: 'source_span', file: source.file, start: { kind: 'number_value', value: Number(item.startOffset.value) }, end: { kind: 'number_value', value: Number(item.endOffset.value) } }
    }));
    const constants: ModelConstant[] = relationProject(declaration.constants, item => ({
        kind: 'model_constant',
        name: constantName(item.name.value),
        visibility: item.visibility,
        value: { kind: 'expression', value: item.value, source },
        source: { kind: 'source_span', file: source.file, start: { kind: 'number_value', value: Number(item.startOffset.value) }, end: { kind: 'number_value', value: Number(item.endOffset.value) } }
    }));
    return {
        inheritance,
        capabilities: { kind: 'model_source_capabilities', traits: { kind: 'model_traits', items: sequence(relationProject(declaration.traits, item => traitName(item.value))) } },
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
    const find = (items: typeof columns.items): RelationOption<ColumnDefinition> => relationGate(
        relationEqual(items.kind, 'cons'),
        () => relationGate(
            relationEqual(items.head.name.value.value, primaryKey.value.value),
            () => relationSome(items.head),
            () => find(items.tail),
        ),
        () => relationNone(),
    );
    const option = find(columns.items);
    return relationOptionFold(
        option,
        column => relationGate(
            relationEqual(column.databaseType.kind, 'integer'),
            () => relationGate(relationEqual(column.databaseType.width.kind, 'big'), () => ({ kind: 'big_integer' as const }), () => ({ kind: 'integer' as const })),
            () => relationGate(relationEqual(column.databaseType.kind, 'string'), () => ({ kind: 'string' as const }), () => { throw Error(`Model boundary violation: primary key schema at "${primaryKey.value.value}" has unsupported database type.`); }),
        ),
        () => { throw Error(`Model boundary violation: primary key schema at "${primaryKey.value.value}" was not found.`); },
    );
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

    relationFold(propertyAsts, propState, (state, property) => { applyModelPropertyAst(property, state); return state; });

    const columns = resolveModelColumns(propState.table, migrations);
    const keyType = relationGate(relationEqual(propState.keyType.kind, 'declared'), () => propState.keyType.value, () => inferKeyTypeFromSchema(columns, propState.primaryKey));
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
            origin: relationGate(relationProject(propertyAsts, property => relationEqual(property.name, 'primaryKey')).includes(true), () => ({ kind: 'explicit' as const }), () => ({ kind: 'conventional' as const }))
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
        columnFacts: buildModelColumnFacts(correlateModelColumnFacts(columns, casts, span)),
        casts: [...casts],
        accessors: [...accessors],
        relations: [...relations]
    });
}

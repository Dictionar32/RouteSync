/**
 * modelParser.ts
 *
 * Builds the canonical model semantic definition from repository PHP AST nodes
 * and already-produced semantic member values.
 *
 * Tokenization and PHP syntax recognition stay below this boundary in
 * ModelScanner. This module does not re-scan source text or classify tokens.
 */

import type { SchemaInterface } from "../../../../types/upstream/schema";
import { inferLaravelTableName } from "../../../../utils/resource-naming";
import { buildModelSemanticDefinition } from "../../semantic/model/modelSemanticDefinition";
import type { ModelKeyKind } from "../../../../types/upstream/model";
import { modelKeyFactsAuthority } from "../../../../types/upstream/modelKeyFactsAuthority";
import { createColumnName, createModelName, createPropertyName, createTableName } from "../../../../types/upstream/names";
import { projectPhpAstExpressionToUpstream } from '../../lexer/routeAst/phpAstExpressionSemanticAuthority';
import type { ModelAccessorFact } from "../../../../types/upstream/modelSourceFacts";
import type { ClassName, ConstantName, MethodName, TraitName } from '../../../../types/upstream/names';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { PhpAstValue } from '../../lexer/PhpAst';
import type { EloquentRelationAst } from "../../../../types/upstream/eloquent";
import type { ModelCast } from "../../../../types/upstream/model";
import type { ModelSemanticDefinition } from "../../../../types/upstream/model";
import type { ModelSemanticDefinitionFromAstInterface } from "../../../../types/upstream/modelProducerInterface";
import type { PhpClassPropertyAst, ModelDeclarationAst } from "../../lexer";
import { modelPropertyEvidenceProducer } from "./memberPropertiesParser";
import { modelPropertyFactsAuthority } from "../../../../types/upstream/modelPropertyFactsAuthority";
import type { ModelPropertyFactsJudgment } from "../../../../types/upstream/modelPropertyFactsAuthorityInterface";
import { resolveModelColumns } from "./columnInferrer";
import { buildModelColumnFacts } from "./modelColumnFactsCanonical";
import { correlateModelColumnFacts } from "./modelColumnOrigin";
import type { SourceSpan } from '../../../../types/upstream/provenance';
import { modelSourceSemanticsAuthority } from '../../../../types/upstream/modelSourceSemanticsAuthority';
import type { ModelMethodReturnTypeEvidence, ModelSourceSemanticsEvidence } from '../../../../types/upstream/modelSourceSemanticsAuthorityInterface';


const text = (value: string): StringValue => ({ kind: 'string_value', value });
const className = (value: string): ClassName => ({ kind: 'class_name', value: text(value) });
const methodName = (value: string): MethodName => ({ kind: 'method_name', value: text(value) });
const constantName = (value: string): ConstantName => ({ kind: 'constant_name', value: text(value) });
const traitName = (value: string): TraitName => ({ kind: 'trait_name', value: text(value) });
export interface PhpAstTypeEvidenceProducerInterface {
    (value: PhpAstValue): ModelMethodReturnTypeEvidence;
}

export const typeEvidenceFromPhpAst: PhpAstTypeEvidenceProducerInterface = value => value.kind === 'class_reference'
    ? { kind: 'class_reference', name: className(value.className.value) }
    : { kind: 'unsupported_type_expression' };

export interface ModelSourceSemanticsEvidenceProducerInterface {
    (declaration: ModelDeclarationAst, source: SourceSpan): ModelSourceSemanticsEvidence;
}

export const sourceSemanticsEvidenceFrom: ModelSourceSemanticsEvidenceProducerInterface = (declaration, source) => ({
    kind: 'model_source_semantics_evidence' as const,
    inheritance: declaration.inheritance.kind === 'eloquent_model'
        ? { kind: 'eloquent_model' as const }
        : declaration.inheritance.kind === 'authenticatable'
            ? { kind: 'authenticatable' as const }
            : { kind: 'class' as const, name: className(declaration.inheritance.name.value) },
    traits: declaration.traits.map(item => traitName(item.value)),
    methods: declaration.methods.map(item => ({
        kind: 'model_method_source_evidence' as const,
        name: methodName(item.name.value),
        visibility: item.visibility,
        returnType: item.returnType.kind === 'absent'
            ? { kind: 'absent' as const }
            : typeEvidenceFromPhpAst(item.returnType.value),
        body: {
            kind: 'source_statements' as const,
            items: item.returns.reduceRight<import('../../../../types/upstream/collections').Sequence<import('../../../../types/upstream/sourceStatements').SourceStatement>>(
                (tail, returnValue) => ({
                    kind: 'cons',
                    head: {
                        kind: 'return',
                        expression: projectPhpAstExpressionToUpstream(returnValue, source.file.value.value),
                        source: {
                            kind: 'source_span',
                            file: source.file,
                            start: { kind: 'number_value', value: Number(item.bodyStart.value) },
                            end: { kind: 'number_value', value: Number(item.bodyEnd.value) },
                        },
                    },
                    tail,
                }),
                { kind: 'empty' },
            ),
        },
        source: {
            kind: 'source_span' as const,
            file: source.file,
            start: { kind: 'number_value' as const, value: Number(item.startOffset.value) },
            end: { kind: 'number_value' as const, value: Number(item.endOffset.value) },
        },
    })),
    constants: declaration.constants.map(item => ({
        kind: 'model_constant' as const,
        name: constantName(item.name.value),
        visibility: item.visibility,
        value: { kind: 'expression' as const, value: item.value, source },
        source: {
            kind: 'source_span' as const,
            file: source.file,
            start: { kind: 'number_value' as const, value: Number(item.startOffset.value) },
            end: { kind: 'number_value' as const, value: Number(item.endOffset.value) },
        },
    })),
});

type ModelPropertyProjectionState = {
    table: ReturnType<typeof createTableName>;
    primaryKey: ReturnType<typeof createColumnName>;
    primaryKeyOrigin: 'explicit' | 'conventional';
    keyType: { readonly kind: 'not_declared' } | { readonly kind: 'declared'; readonly value: ModelKeyKind };
    incrementing: { readonly value: boolean; readonly origin: 'laravel_default' | 'source_explicit' };
    fillable: ReturnType<typeof createPropertyName>[];
    guarded: ReturnType<typeof createPropertyName>[];
    hidden: ReturnType<typeof createPropertyName>[];
    appends: ReturnType<typeof createPropertyName>[];
};

const applyModelPropertyJudgment = (judgment: ModelPropertyFactsJudgment, state: ModelPropertyProjectionState): void => {
    switch (judgment.kind) {
        case 'set_model_table': state.table = judgment.value; return;
        case 'set_model_primary_key': state.primaryKey = judgment.value; state.primaryKeyOrigin = 'explicit'; return;
        case 'set_model_key_type': state.keyType = { kind: 'declared', value: judgment.value }; return;
        case 'set_model_incrementing': state.incrementing = { value: judgment.value, origin: 'source_explicit' }; return;
        case 'set_model_fillable': state.fillable = [...judgment.value]; return;
        case 'set_model_guarded': state.guarded = [...judgment.value]; return;
        case 'set_model_hidden': state.hidden = [...judgment.value]; return;
        case 'set_model_appends': state.appends = [...judgment.value]; return;
        case 'unsupported_model_key_type': throw Error(`Model boundary violation: unsupported Eloquent $keyType "${judgment.value}".`);
        case 'ignored_model_property': return;
    }
};

/**
 * Canonical semantic model owner built exclusively from AST/ADT-derived inputs.
 * The eight Laravel model properties are consumed through PhpClassPropertyAst.
 */
export const modelSemanticDefinitionFromAst: ModelSemanticDefinitionFromAstInterface<ModelDeclarationAst, PhpClassPropertyAst> = Object.freeze({
    kind: "model_semantic_definition_from_ast",
    contractVersion: 1,
    form: (
    sourceSpan,
    schema,
    propertyAsts,
    declaration,
    casts,
    accessors,
    relations,
): ModelSemanticDefinition => {
    const sourceSemantics = modelSourceSemanticsAuthority.judge(sourceSemanticsEvidenceFrom(declaration, sourceSpan));
    const modelName = declaration.name;
    const defaultTable = inferLaravelTableName(modelName);
    const propState: ModelPropertyProjectionState & {
        softDeletes: { readonly value: boolean; readonly origin: 'laravel_default' | 'source_explicit' };
        timestamps: { readonly value: boolean; readonly origin: 'laravel_default' | 'source_explicit' };
    } = {
        table: createTableName(defaultTable),
        primaryKey: createColumnName('id'),
        primaryKeyOrigin: 'conventional',
        keyType: { kind: 'not_declared' },
        incrementing: { value: true, origin: 'laravel_default' },
        softDeletes: { value: false, origin: 'laravel_default' },
        timestamps: { value: true, origin: 'laravel_default' },
        fillable: [],
        guarded: [createPropertyName('*')],
        hidden: [],
        appends: []
    };

    propertyAsts.reduce((state, property) => {
        const judgment = modelPropertyFactsAuthority.judge(modelPropertyEvidenceProducer.scan(property));
        applyModelPropertyJudgment(judgment, state);
        return state;
    }, propState);

    const columns = resolveModelColumns(propState.table, schema);
    const keyJudgment = modelKeyFactsAuthority.judge({
        kind: 'model_key_facts_evidence',
        primaryKey: propState.primaryKey,
        declared: propState.keyType.kind === 'declared'
            ? { kind: 'declared', value: propState.keyType.value }
            : { kind: 'infer_from_schema' },
        columns: columns.items,
    });
    const resolvedKeyJudgment = keyJudgment.kind === 'resolved_model_key'
        ? keyJudgment
        : keyJudgment.kind === 'missing_model_key_column'
            ? (() => { throw Error(`Model boundary violation: primary key schema at "${keyJudgment.primaryKey.value.value}" was not found.`); })()
            : (() => { throw Error(`Model boundary violation: primary key schema at "${keyJudgment.primaryKey.value.value}" has unsupported database type "${keyJudgment.databaseType}".`); })();
    const keyType = resolvedKeyJudgment.keyType;
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
            semanticType: resolvedKeyJudgment.semanticType,
            origin: { kind: propState.primaryKeyOrigin }
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
        relations: [...relations],
        schema
    });
    },
});

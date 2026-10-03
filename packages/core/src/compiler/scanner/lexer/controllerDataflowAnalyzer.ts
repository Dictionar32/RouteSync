import type { AstIdentifier, PhpAstValue, PhpBlock, PhpStatement, PhpIfAlternative, TokenDescriptor } from './phpAstTypes';
import { createAstIdentifier } from './phpAstTypes';
import { createSourceOffset } from './phpAstCoreTypes';
import { PHP_STATEMENT_KINDS } from './phpAstStatementKinds';
import { PhpAstFactory } from './phpAstFactory';
import type { ControllerDataflowAst } from './controllerBodyAstTypes';
import { relationNone, relationOptionFold, relationSome, relationProject, relationFold, relationSelect, relationGate, relationRefine, relationAdvanceIndex, relationExpand, relationFirst, relationAll, relationAny, relationLookup, relationMapValueOr, type RelationOption } from '../../../semantic/kernel/relationalSequence';
import { relationEqual } from '../../../semantic/kernel/semanticRelations';
import { solveCandidate, requirement } from '../../../semantic/kernel/semanticDecisionRewriteEngine';
import { produceSemanticKnowledgeDataFlow } from './routeAst/semanticKnowledgeDataFlowProducer';
import { knowledgeIdKey, semanticPresenceFold, type KnowledgeId, type SemanticKnowledgeDataFlow } from './routeAst/semanticKnowledgeDataFlowRelations';
import type { ControllerVariableSemantic, ControllerSemanticVariableFlow, ControllerVariableBinding, ControllerVariableDefinition, ControllerVariableOrigin } from '../../../types/upstream/controller';
import { relationIndexAdd, relationIndexLookup, type RelationIndex } from '../../../semantic/kernel/relationMembership';
import { mapResourcePhpAstToUpstream } from '../subscanners/resource/resourceUpstreamExpressionCanonical';

/**
 * Compatibility projection over the canonical semantic knowledge/data-flow
 * authority. Semantic meaning is produced upstream; this layer only projects
 * the closed semantic facts into the historical scanner contract still exposed
 * by ControllerBodyAst consumers.
 */
export function analyzeControllerDataflow(
    block: PhpBlock,
    parameters: readonly AstIdentifier[],
    parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[] = [],
    filePath = '<php-source>'
): ControllerDataflowAst {
    const semanticKnowledgeDataFlow = produceSemanticKnowledgeDataFlow(block, filePath);
    const statementPayloads = collectStatementPayloads(block);
    const bindings = relationSelect(
        semanticKnowledgeDataFlow.facts,
        (fact): fact is Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'binding' }> => relationEqual(fact.kind, 'binding'),
    );
    const semanticVariables = canonicalSemanticVariables(
        relationProject(bindings, fact => canonicalDefinition(fact.value, statementPayloads, semanticKnowledgeDataFlow, parameterSemantics, filePath)),
    );
    return Object.freeze({
        semanticKnowledgeDataFlow,
        semanticVariables,
    });
}

const canonicalDefinition = (
    binding: Extract<SemanticKnowledgeDataFlow['facts'][number], { kind: 'binding' }>['value'],
    payloads: readonly StatementPayload[],
    model: SemanticKnowledgeDataFlow,
    parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[],
    filePath: string,
): ControllerVariableDefinition => {
    const fallbackValue: PhpAstValue = Object.freeze({
        ...PhpAstFactory.unsupported([]),
        source: {
            startOffset: createSourceOffset(binding.source.span.start.value),
            endOffset: createSourceOffset(binding.source.span.end.value),
        },
    });
    const payload = relationOptionFold(
        relationFirst(payloads, item => sameSpan(item.sourceStart, item.sourceEnd, binding.source.span.start.value, binding.source.span.end.value)),
        () => ({ statementIndex: -1, value: fallbackValue }),
        item => item,
    );
    const expression = mapResourcePhpAstToUpstream(payload.value, filePath);
    return Object.freeze({
        variable: { kind: 'variable_name', value: { kind: 'string_value', value: identifierFromKnowledge(model, binding.variable) } },
        origin: canonicalVariableOrigin(binding.origin.code, payload.statementIndex),
        expression,
        semantic: semanticForValue(payload.value, parameterSemantics),
        source: expression.source,
    });
};

function canonicalSemanticVariables(
    definitions: readonly ControllerVariableDefinition[],
): ControllerSemanticVariableFlow {
    const grouped = relationFold<ControllerVariableDefinition, RelationIndex<string, readonly ControllerVariableDefinition[]>>(
        definitions,
        [],
        (current, definition) => {
            const key = definition.variable.value.value;
            const existing = relationIndexLookup(current, key);
            const entries = relationOptionFold(existing, () => [definition], value => [...value, definition]);
            return relationIndexAdd(current, key, entries);
        },
    );
    const bindings = relationProject(grouped, ([name, entries]) => Object.freeze({
        variable: { kind: 'variable_name', value: { kind: 'string_value', value: name } },
        definitions: sequenceFromCanonicalDefinitions(entries),
    } satisfies ControllerVariableBinding));
    return Object.freeze({ variables: sequenceFromCanonicalBindings(bindings) });
}

function sequenceFromCanonicalDefinitions(values: readonly ControllerVariableDefinition[]): import('../../../types/upstream/collections').Sequence<ControllerVariableDefinition> {
    return relationFold<ControllerVariableDefinition, import('../../../types/upstream/collections').Sequence<ControllerVariableDefinition>>(
        [...values].reverse(),
        { kind: 'empty' },
        (tail, value) => ({ kind: 'cons', head: value, tail }),
    );
}

function sequenceFromCanonicalBindings(values: readonly ControllerVariableBinding[]): import('../../../types/upstream/collections').Sequence<ControllerVariableBinding> {
    return relationFold<ControllerVariableBinding, import('../../../types/upstream/collections').Sequence<ControllerVariableBinding>>(
        [...values].reverse(),
        { kind: 'empty' },
        (tail, value) => ({ kind: 'cons', head: value, tail }),
    );
}

function canonicalVariableOrigin(
    origin: 'parameter' | 'assignment' | 'iteration' | 'exception_handler',
    statementIndex: number,
): ControllerVariableOrigin {
    const catalog: readonly (readonly ['parameter' | 'assignment' | 'iteration' | 'exception_handler', ControllerVariableOrigin])[] = [
        ['iteration', Object.freeze({ kind: 'foreach', statementIndex: { kind: 'number_value', value: statementIndex } })],
        ['exception_handler', Object.freeze({ kind: 'catch', statementIndex: { kind: 'number_value', value: statementIndex } })],
        ['parameter', Object.freeze({ kind: 'parameter' })],
        ['assignment', Object.freeze({ kind: 'assignment', statementIndex: { kind: 'number_value', value: statementIndex } })],
    ];
    return relationOptionFold(relationLookup(catalog, origin), () => ({ kind: 'external' }), value => value);
}

type VariableReferenceValue = Extract<PhpAstValue, { readonly kind: 'variable_reference' }>;
type StaticCallValue = Extract<PhpAstValue, { readonly kind: 'static_call' }>;
type StringLiteralValue = Extract<PhpAstValue, { readonly kind: 'literal'; readonly literalType: 'string' }>;
const isStringLiteral = (candidate: PhpAstValue): candidate is StringLiteralValue => relationOptionFold(
    relationRefine(candidate, (value): value is Extract<PhpAstValue, { readonly kind: 'literal' }> => relationEqual(value.kind, 'literal')),
    () => false,
    value => relationEqual(value.literalType, 'string'),
);

const variableReference = (value: PhpAstValue): RelationOption<VariableReferenceValue> => relationRefine(value, (candidate): candidate is VariableReferenceValue => relationEqual(candidate.kind, 'variable_reference'));
const staticCall = (value: PhpAstValue): RelationOption<StaticCallValue> => relationRefine(value, (candidate): candidate is StaticCallValue => relationEqual(candidate.kind, 'static_call'));

const solveSemanticCandidate = (value: PhpAstValue, parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[]): ControllerVariableSemantic => {
    const variableName = relationOptionFold(variableReference(value), () => createAstIdentifier('external'), current => current.name);
    const dbTable = relationOptionFold(
        staticCall(value),
        () => '',
        current => relationGate(
            relationAll([relationEqual(current.className, 'DB'), relationEqual(current.method, 'table')]),
            () => relationOptionFold(relationFirst(current.arguments, () => true), () => '', argument => relationGate(
                relationEqual(argument.kind, 'positional'),
                () => relationOptionFold(
                    relationRefine(argument.value, isStringLiteral),
                    () => '',
                    candidate => candidate.value,
                ),
                () => '',
            )),
            () => '',
        ),
    );
    const selected = solveCandidate([
        { id: 'parameter', value: relationMapValueOr(parameterSemantics, variableName, { kind: 'external' }), requirements: [requirement('variable', relationOptionFold(variableReference(value), () => false, () => true))] },
        { id: 'db-table', value: { kind: 'model_origin', origin: { kind: 'table', name: { kind: 'table_name', value: { kind: 'string_value', value: dbTable } } } }, requirements: [requirement('db-table', relationEqual(dbTable, ''))] },
        { id: 'external', value: { kind: 'external' }, requirements: [requirement('fallback', true)] },
    ]);
    return relationOptionFold(selected, () => ({ kind: 'external' }), value => value);
};

function identifierFromKnowledge(model: SemanticKnowledgeDataFlow, id: KnowledgeId): AstIdentifier {
    const fact = relationOptionFold(
        relationFirst(model.facts, item => relationEqual(knowledgeIdKey(item.value.id), knowledgeIdKey(id))),
        () => relationNone<SemanticKnowledgeDataFlow['facts'][number]>(),
        value => relationSome(value),
    );
    return relationOptionFold(
        fact,
        () => createAstIdentifier(id.identity.slot.value),
        item => relationOptionFold(
            relationRefine(item, (candidate): candidate is Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'variable' }> => relationEqual(candidate.kind, 'variable')),
            () => relationOptionFold(
                relationRefine(item, (candidate): candidate is Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'value' }> => relationEqual(candidate.kind, 'value')),
                () => createAstIdentifier(id.identity.slot.value),
                value => semanticPresenceFold(value.value.name, () => createAstIdentifier(id.identity.slot.value), name => createAstIdentifier(name.value.value)),
            ),
            variable => createAstIdentifier(variable.value.name.value.value),
        ),
    );
}

const sameSpan = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean => relationAll([relationEqual(aStart, bStart), relationEqual(aEnd, bEnd)]);
const containsSpan = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean => relationAll([aStart <= bStart, aEnd >= bEnd]);

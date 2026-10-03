import { PHP_STATEMENT_KINDS } from './phpAstStatementKinds';
import type { AstIdentifier, PhpAstValue, PhpBlock, PhpStatement, PhpIfAlternative, TokenDescriptor } from './phpAstTypes';
import { createSourceOffset } from './phpAstCoreTypes';
import { PhpAstFactory } from './phpAstFactory';
import type { ControllerDataflowAst, ControllerVariableDefinition, ControllerVariableReference, LegacyControllerDefinitionAvailability } from './controllerBodyAstTypes';
import { relationNone, relationOptionFold, relationSome, relationProject, relationSelect, relationGate, relationRefine } from '../../../semantic/kernel/relationalSequence';
import { relationEqual, relationAny } from '../../../semantic/kernel/semanticRelations';
import { produceSemanticKnowledgeDataFlow } from './routeAst/semanticKnowledgeDataFlowProducer';
import { knowledgeIdKey, type KnowledgeId, type SemanticKnowledgeDataFlow, type SemanticPresence } from './routeAst/semanticKnowledgeDataFlowRelations';
import type { ControllerVariableSemantic } from '../../../types/upstream/controller';

export interface ControllerDataflowReference extends ControllerVariableReference {
    readonly availability: LegacyControllerDefinitionAvailability;
}

/**
 * Controller dataflow is now a compatibility projection of the canonical
 * semantic knowledge/data-flow model. The old definite-assignment walk is gone:
 * no Map of variables, branchPath, or statement traversal decides knowledge.
 *
 * The PHP AST is used only to recover legacy payloads (`PhpAstValue` and the
 * historical statement index) retained as compatibility payloads.
 */
export function analyzeControllerDataflow(
    block: PhpBlock,
    parameters: readonly AstIdentifier[],
    parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[] = [],
    filePath = '<php-source>'
): ControllerDataflowAst {
    const semanticKnowledgeDataFlow = produceSemanticKnowledgeDataFlow(block, filePath);
    const statementPayloads = collectStatementPayloads(block);
    const definitions = relationProject(
        relationSelect(semanticKnowledgeDataFlow.facts, fact => relationEqual(fact.kind, 'binding')),
        fact => legacyDefinition(fact.value, statementPayloads, semanticKnowledgeDataFlow, parameterSemantics),
    );
    const references = relationProject(
        relationSelect(semanticKnowledgeDataFlow.facts, fact => relationEqual(fact.kind, 'reference')),
        fact => legacyReference(fact.value, statementPayloads, semanticKnowledgeDataFlow),
    );
    return Object.freeze({
        definitions: Object.freeze(definitions),
        references: Object.freeze(references),
        semanticKnowledgeDataFlow,
    });
}

interface StatementPayload {
    readonly statementIndex: number;
    readonly sourceStart: number;
    readonly sourceEnd: number;
    readonly value: PhpAstValue;
}

const statementPayload = (statement: PhpStatement, statementIndex: number): StatementPayload => ({
    statementIndex,
    sourceStart: statement.source.startOffset,
    sourceEnd: statement.source.endOffset,
    value: relationGate(
        relationEqual(statement.kind, PHP_STATEMENT_KINDS.assignment),
        () => statement.value,
        () => relationGate(
            relationEqual(statement.kind, PHP_STATEMENT_KINDS.collectionRecurrence),
            () => statement.iterable,
            () => PhpAstFactory.unsupported([]),
        ),
    ),
});

function collectStatementPayloads(block: PhpBlock): readonly StatementPayload[] {
    const visit = (current: PhpBlock, index = 0, output: readonly StatementPayload[] = []): readonly StatementPayload[] =>
        relationGate(index < current.statements.length,
            () => {
                const statement = current.statements[index];
                const next = [...output, statementPayload(statement, index)];
                const nested = relationProject(nestedBlocks(statement), child => visit(child, 0, []));
                return visit(current, relationAdvanceIndex(index, 1), [...next, ...relationExpand(nested, value => value)]);
            },
            () => output);
    return relationProject(visit(block), (item, index) => Object.freeze({ ...item, statementIndex: index }));
}

type ConditionalStatement = Readonly<{ readonly kind: typeof PHP_STATEMENT_KINDS.conditional; readonly condition: PhpAstValue; readonly thenBlock: PhpBlock; readonly alternative: PhpIfAlternative; readonly source: TokenDescriptor }>;

const conditionalStatement = (statement: PhpStatement): RelationOption<ConditionalStatement> => relationRefine(statement, (candidate): candidate is ConditionalStatement => relationEqual(candidate.kind, PHP_STATEMENT_KINDS.conditional));

const alternativeBlock = (statement: ConditionalStatement): RelationOption<PhpBlock> => relationGate(
    relationEqual(statement.alternative.kind, 'else_block'),
    () => relationSome(statement.alternative.block),
    () => relationGate(
        relationEqual(statement.alternative.kind, 'else_if'),
        () => relationSome({ kind: 'block', statements: [statement.alternative.statement] }),
        () => relationNone(),
    ),
);

const finallyBlock = (statement: PhpStatement): RelationOption<PhpBlock> => relationGate(
    relationEqual(statement.kind, 'try_statement'),
    () => relationGate(
        relationEqual(statement.finallyBlock.kind, 'present'),
        () => relationSome(statement.finallyBlock.block),
        () => relationNone(),
    ),
    () => relationNone(),
);

const nestedBlocks = (statement: PhpStatement): readonly PhpBlock[] => relationGate(
    relationEqual(statement.kind, PHP_STATEMENT_KINDS.conditional),
    () => relationOptionFold(conditionalStatement(statement), () => [], conditional => [conditional.thenBlock, ...relationOptionFold(alternativeBlock(conditional), () => [], value => [value])]),
    () => relationGate(
        relationAny([
            relationEqual(statement.kind, PHP_STATEMENT_KINDS.preTestRecurrence),
            relationEqual(statement.kind, PHP_STATEMENT_KINDS.collectionRecurrence),
            relationEqual(statement.kind, PHP_STATEMENT_KINDS.countedRecurrence),
        ]),
        () => [statement.body],
        () => relationGate(
            relationEqual(statement.kind, 'try_statement'),
            () => [statement.body, ...relationProject(statement.catches, value => value.body), ...relationOptionFold(finallyBlock(statement), () => [], value => [value])],
            () => [],
        ),
    ),
);

const legacyDefinition = (binding: Extract<SemanticKnowledgeDataFlow['facts'][number], { kind: 'binding' }>['value'], payloads: readonly StatementPayload[], model: SemanticKnowledgeDataFlow, parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[]): ControllerVariableDefinition => {
    const payload = relationOptionFold(relationFirst(payloads, item => sameSpan(item.sourceStart, item.sourceEnd, binding.source.span.start.value, binding.source.span.end.value)), () => ({ statementIndex: -1, value: PhpAstFactory.unsupported([]) }), item => item);
    const name = identifierFromKnowledge(model, binding.variable);
    return {
        name,
        statementIndex: payload.statementIndex,
        origin: legacyDefinitionOrigin(binding.origin.code, payload.statementIndex),
        value: payload.value,
        semantic: semanticForLegacyValue(payload.value, parameterSemantics),
        availability: legacyAvailability(binding.availability, binding.origin.code),
    };
};

const legacyReference = (reference: Extract<SemanticKnowledgeDataFlow['facts'][number], { kind: 'reference' }>['value'], payloads: readonly StatementPayload[], model: SemanticKnowledgeDataFlow): ControllerDataflowReference => {
    const statement = relationOptionFold(relationFirst(payloads, item => containsSpan(item.sourceStart, item.sourceEnd, reference.source.span.start.value, reference.source.span.end.value)), () => ({ statementIndex: -1 }), item => item);
    return { name: identifierFromKnowledge(model, reference.variable), statementIndex: statement.statementIndex, origin: { kind: 'external' }, availability: legacyAvailability(reference.availability, 'assignment') };
};

function semanticForLegacyValue(value: PhpAstValue, parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[]): ControllerVariableSemantic {
    return solveSemanticCandidate(value, parameterSemantics);
}

const solveSemanticCandidate = (value: PhpAstValue, parameterSemantics: readonly (readonly [AstIdentifier, ControllerVariableSemantic])[]): ControllerVariableSemantic => {
    const variableName = relationGate(relationEqual(value.kind, 'variable_reference'), () => value.name, () => createAstIdentifier(''));
    const dbTable = relationGate(relationAll([
        relationEqual(value.kind, 'static_call'),
        relationEqual(value.className, 'DB'),
        relationEqual(value.method, 'table'),
    ]), () => relationGate(relationGate(relationSome(value.arguments[0]), () => relationEqual(value.arguments[0].kind, 'positional'), () => false), () => relationGate(relationEqual(value.arguments[0].value.kind, 'literal'), () => relationGate(relationEqual(value.arguments[0].value.literalType, 'string'), () => value.arguments[0].value.value, () => ''), () => ''), () => ''), () => '');
    return solveCandidate([
        { id: 'parameter', value: relationMapValueOr(parameterSemantics, variableName, { kind: 'external' }), requirements: [requirement('variable', relationEqual(value.kind, 'variable_reference'))] },
        { id: 'db-table', value: { kind: 'model_origin', origin: { kind: 'table', name: { kind: 'table_name', value: { kind: 'string_value', value: dbTable } } } }, requirements: [requirement('db-table', relationEqual(dbTable, ''))] },
        { id: 'external', value: { kind: 'external' }, requirements: [requirement('fallback', true)] },
    ])!;
};

function legacyDefinitionOrigin(origin: 'parameter' | 'assignment' | 'iteration' | 'exception_handler', statementIndex: number): ControllerVariableDefinition['origin'] {
    const catalog = [
        ['iteration', { kind: 'foreach', statementIndex }],
        ['exception_handler', { kind: 'catch', statementIndex }],
        ['parameter', { kind: 'assignment' }],
        ['assignment', { kind: 'assignment' }],
    ] as const;
    return relationOptionFold(relationLookup(catalog, origin), () => ({ kind: 'assignment' }), value => value);
}

function legacyAvailability(availability: SemanticPresence<KnowledgeId>, origin: string): LegacyControllerDefinitionAvailability {
    return solveCandidate([
        { id: 'definite', value: { kind: 'definite' }, requirements: [requirement('absent', relationEqual(availability.kind, 'absent'))] },
        { id: 'loop', value: { kind: 'loop_conditional', branchPath: [] }, requirements: [requirement('iteration', relationEqual(origin, 'iteration'))] },
        { id: 'catch', value: { kind: 'catch_conditional', branchPath: [] }, requirements: [requirement('catch', relationEqual(origin, 'exception_handler'))] },
        { id: 'branch', value: { kind: 'branch_conditional', branchPath: [] }, requirements: [requirement('fallback', true)] },
    ])!;
}

function identifierFromKnowledge(model: SemanticKnowledgeDataFlow, id: KnowledgeId): AstIdentifier {
    const key = knowledgeIdKey(id);
    const fact = relationOptionFold(relationFirst(model.facts, item => relationEqual(knowledgeIdKey(item.value.id), key)), () => relationNone(), value => ({ kind: 'some', value }));
    return relationOptionFold(fact, () => id.identity.slot.value, item => solveCandidate([
        { id: 'variable', value: item.value.name.value, requirements: [requirement('variable', relationEqual(item.kind, 'variable'))] },
        { id: 'named', value: item.value.name.value, requirements: [requirement('named', relationGate(relationEqual(item.kind, 'value'), () => relationEqual(item.value.name.kind, 'present'), () => false))] },
        { id: 'identity', value: id.identity.slot.value, requirements: [requirement('fallback', true)] },
    ])!);
}

const sameSpan = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean => relationAll([relationEqual(aStart, bStart), relationEqual(aEnd, bEnd)]);
const containsSpan = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean => relationAll([aStart <= bStart, aEnd >= bEnd]);

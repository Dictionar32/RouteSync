import { relationResolve } from '../../../relational/sequence';
import { project, retain, expand, accumulate, visit } from './semanticRelationalCollections';
import { projectRelation, visitRelation } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold, type RelationOption } from '../../../../semantic/relations/relationalSequence';
import { relationEqual, relationNotEqual } from '../../../../semantic/relations/semanticRelations';
import type { PhpAstValue, PhpBlock } from '../phpAstTypes';
import type { SourceFile } from '../../../../types/upstream/names';
import type { SemanticEvidenceProvider } from '../../../../types/upstream/semanticDataflowKnowledge';
import { compileSemanticEvidenceRelations } from './semanticEvidenceRelationCompiler';
import type { SemanticModRefFact, SemanticModRefRelation } from '../../../../types/upstream/semanticDataflowKnowledge';
import { semanticModRefEffectFactory } from '../../../../types/upstream/semanticModRefFactOperations';
import { createPhpAstExpressionProjector } from './phpAstExpressionSyntaxEvidenceRegistry';
import { buildSemanticCompilationArtifact } from './semanticCompilationArtifact';
import type { PhpStatement } from '../phpAstTypes';
import { phpStatementSyntaxEvidenceProjection } from './phpAstStatementSyntaxEvidenceRegistry';
import { type SemanticFact, type SemanticKnowledgeDataFlow, type SemanticDataFlowFact, type SemanticOperatorCode, type SemanticDataFlowRelationCode, type SemanticDataFlowRoleCode, type SemanticLiteral, type SemanticPresence, semanticDependency, semanticValueFlow, semanticEdge, semanticFact, semanticSource, semanticText, semanticNumber, semanticBoolean, knowledgeId, knowledgeIdKey, semanticIdentifier, semanticOperation, semanticPresent, semanticAbsent, SEMANTIC_VALUE_KIND_KNOWLEDGE, SEMANTIC_OUTCOME_ROLE_KNOWLEDGE, SEMANTIC_ACCESS_MODE_KNOWLEDGE, SEMANTIC_OPERATOR_INDEX, SEMANTIC_CAST_KNOWLEDGE, SEMANTIC_EMISSION_KNOWLEDGE, SEMANTIC_INCLUDE_KNOWLEDGE, SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE, SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE, SEMANTIC_BINDING_ORIGIN_KNOWLEDGE, SEMANTIC_PREDICATE_MEANING_KNOWLEDGE, SEMANTIC_MATCH_MODE_KNOWLEDGE, semanticKnowledgeDataFlowWiring, validateSemanticKnowledgeDataFlow, } from './semanticKnowledgeDataFlowRelations';
const sourceOf = (value: {
    readonly source: {
        readonly startOffset: number;
        readonly endOffset: number;
    };
}, sourceFile: SourceFile, evidenceProvider: SemanticEvidenceProvider) => semanticSource.create(sourceFile.value.value, value.source.startOffset, value.source.endOffset, evidenceProvider);
const semanticOperator = (kind: string): RelationOption<import('./semanticKnowledgeDataFlowRelations').SemanticOperatorDefinition> => relationFirstOption(SEMANTIC_OPERATOR_INDEX, ([candidate]) => relationEqual(candidate, kind));
const semanticValueKind = (code: import('./semanticKnowledgeDataFlowRelations').SemanticValueKindCode) => SEMANTIC_VALUE_KIND_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const semanticOutcomeRole = (code: import('./semanticKnowledgeDataFlowRelations').SemanticOutcomeRoleCode) => SEMANTIC_OUTCOME_ROLE_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const semanticAccessMode = (code: import('./semanticKnowledgeDataFlowRelations').SemanticAccessModeCode) => SEMANTIC_ACCESS_MODE_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const semanticAssignmentOperator = (code: import('./semanticKnowledgeDataFlowRelations').SemanticAssignmentOperatorCode) => SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const semanticAssignmentReference = (code: import('./semanticKnowledgeDataFlowRelations').SemanticAssignmentReferenceCode) => SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const semanticBindingOrigin = (code: import('./semanticKnowledgeDataFlowRelations').SemanticBindingOriginCode) => SEMANTIC_BINDING_ORIGIN_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const semanticPredicateMeaning = (code: import('./semanticKnowledgeDataFlowRelations').SemanticPredicateMeaningCode) => SEMANTIC_PREDICATE_MEANING_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const semanticMatchMode = (code: import('./semanticKnowledgeDataFlowRelations').SemanticMatchModeCode) => SEMANTIC_MATCH_MODE_KNOWLEDGE.find(definition => relationEqual(definition.code, code))!;
const literalValue = (value: PhpAstValue): import('./semanticKnowledgeDataFlowRelations').SemanticPresence<SemanticLiteral> => {
    const literal = relationFirstOption([value], (candidate): candidate is import('../phpAstExpressionTypes').PhpLiteralValue => relationEqual(candidate.kind, 'literal'));
    return relationOptionFold(
        literal,
        () => semanticAbsent('not_applicable'),
        candidate => {
            const projectors: Readonly<Record<string, (item: unknown) => SemanticLiteral>> = {
                null: () => ({ kind: 'null' }),
                string: item => ({ kind: 'string', value: semanticText.create(String(item)) }),
                number: item => ({ kind: 'number', value: semanticNumber.create(Number(item)) }),
                boolean: item => ({ kind: 'boolean', value: semanticBoolean.create(Boolean(item)) }),
            };
            return relationOptionFold(
                relationFirstOption(Object.entries(projectors), ([kind]) => relationEqual(kind, candidate.literalType)),
                () => semanticAbsent('not_provided'),
                ([, projector]) => semanticPresent(projector(candidate.value)),
            );
        },
    );
};
/**
 * Semantic producer. Syntax is inspected only to construct facts. The output
 * contains no PHP AST values, statement nodes, syntax dispatch names, or traversal order.
 */
export type PhpAstSemanticKnowledgeDataFlowProductionOutcome = import('../../../../types/upstream/semanticKnowledgeEvidenceAdapterInterface').SemanticKnowledgeEvidenceProductionOutcome;

export interface PhpAstSemanticKnowledgeDataFlowProductionInput {
    readonly block: PhpBlock;
    readonly sourceFile: SourceFile;
    readonly evidenceProvider: SemanticEvidenceProvider;
}

export interface PhpAstSemanticKnowledgeDataFlowProductionOperationInterface {
    readonly produceWithOutcome: (input: PhpAstSemanticKnowledgeDataFlowProductionInput) => PhpAstSemanticKnowledgeDataFlowProductionOutcome;
    readonly produce: (input: PhpAstSemanticKnowledgeDataFlowProductionInput) => SemanticKnowledgeDataFlow;
}

export const phpAstSemanticKnowledgeDataFlowProductionOperation: PhpAstSemanticKnowledgeDataFlowProductionOperationInterface = Object.freeze({
  produceWithOutcome: (input: PhpAstSemanticKnowledgeDataFlowProductionInput): PhpAstSemanticKnowledgeDataFlowProductionOutcome => {
    const { block, sourceFile, evidenceProvider } = input;
    const evidenceSourceOf = (value: {
        readonly source: {
            readonly startOffset: number;
            readonly endOffset: number;
        };
    }) => sourceOf(value, sourceFile, evidenceProvider);
    const facts: SemanticFact[] = [];
    const modRefFacts: SemanticModRefFact[] = [];
    const modRefRelations: SemanticModRefRelation[] = [];
    const recordModRefFact: (fact: SemanticModRefFact) => void = (fact: SemanticModRefFact): void => { modRefFacts.push(Object.freeze(fact)); };
    const recordModRefRelation: (relation: SemanticModRefRelation) => void = (relation: SemanticModRefRelation): void => { modRefRelations.push(Object.freeze(relation)); };
    const recordModRefRelations: (relations: readonly SemanticModRefRelation[]) => void = (relations: readonly SemanticModRefRelation[]): void => { for (const relation of relations) recordModRefRelation(relation); };
    const dataFlow: SemanticDataFlowFact[] = [];
    // Implementation-only interning index. Canonical variable identity remains a typed fact.
    let variableIndex: readonly (readonly [string, import('./semanticKnowledgeDataFlowRelations').KnowledgeId])[] = [];
    // Identity is represented as a relation catalog rather than a host Map.
    let currentScopeKey = 'root';
    const add = (fact: SemanticFact): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = fact.value.id;
        facts.push(semanticFact(fact));
        return id;
    };
    const relate = (from: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, to: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, relation: SemanticDataFlowRelationCode, role: SemanticDataFlowRoleCode, guard?: SemanticPresence<import('./semanticKnowledgeDataFlowRelations').SemanticFlowGuard>): void => {
        const effectiveGuard = guard ?? semanticAbsent('not_provided');
        const flowFact = effectiveGuard.kind === 'present'
            ? relationResolve(
                relationEqual(relation, 'depends_on'),
                () => semanticDependency.create(from, to, role, effectiveGuard.value),
                () => semanticValueFlow.create(from, to, role, effectiveGuard.value),
            )
            : relationResolve(
                relationEqual(relation, 'depends_on'),
                () => semanticDependency.create(from, to, role),
                () => semanticValueFlow.create(from, to, role),
            );
        const candidateRelation: SemanticPresence<SemanticDataFlowFact> = relationResolve(
            relationEqual(knowledgeIdKey(from), knowledgeIdKey(to)),
            () => semanticAbsent('not_applicable'),
            () => semanticPresent(flowFact),
        );
        if (candidateRelation.kind === 'present') dataFlow.push(candidateRelation.value);
    };
    const outcome = (id: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, role: import('./semanticKnowledgeDataFlowRelations').SemanticOutcomeRoleCode, value: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, source: ReturnType<typeof semanticSource.create>): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const outcomeId = add({ kind: 'outcome', value: { id, role: semanticOutcomeRole(role), value: semanticPresent(value), source } });
        relate(outcomeId, value, 'depends_on', 'value');
        return outcomeId;
    };
    /**
     * Elevate a boolean/guard expression into semantic knowledge. The expression
     * remains evidence of the predicate, but the predicate itself becomes a
     * first-class fact consumed by relational closure.
     */
    const predicate = (expressionId: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, source: ReturnType<typeof semanticSource.create>, meaning: import('./semanticKnowledgeDataFlowRelations').SemanticPredicateMeaningCode = 'boolean_evaluation', slot = 'self'): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = knowledgeId(source, 'predicate', slot);
        const predicateId = add({ kind: 'predicate', value: { id, meaning: semanticPredicateMeaning(meaning), expression: expressionId, source } });
        relate(predicateId, expressionId, 'depends_on', 'value');
        return predicateId;
    };
    const match = (subject: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, candidate: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, mode: import('./semanticKnowledgeDataFlowRelations').SemanticMatchModeCode, source: ReturnType<typeof semanticSource.create>, slot: string): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = knowledgeId(source, 'match', slot);
        const matchId = add({ kind: 'match', value: { id, mode: semanticMatchMode(mode), subject, candidate, source } });
        relate(matchId, subject, 'depends_on', 'subject');
        relate(matchId, candidate, 'depends_on', 'candidate');
        return matchId;
    };
    let visit: (current: PhpBlock, scopeHint: string, availability?: import('./semanticKnowledgeDataFlowRelations').SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId>) => import('./semanticKnowledgeDataFlowRelations').KnowledgeId;
    const semanticVariable = (name: string, source: ReturnType<typeof semanticSource.create>): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const key = `${currentScopeKey}:${name}`;
        return relationOptionFold(relationFirstOption(variableIndex, ([candidate]) => relationEqual(candidate, key)), () => {
            const id = knowledgeId(semanticSource.createForFile(sourceFile, source.span.start.value, source.span.end.value, evidenceProvider), 'variable', key);
            variableIndex = [...retain(variableIndex, ([candidate]) => relationNotEqual(candidate, key)), [key, id] as const];
            add({ kind: 'variable', value: { id, name: semanticIdentifier.create(name), scope: knowledgeId(semanticSource.createForFile(sourceFile, 0, 0, evidenceProvider), 'scope', currentScopeKey), source } });
            return id;
        }, ([, value]) => value);
    };
    let expression: (value: PhpAstValue, hint: string) => import('./semanticKnowledgeDataFlowRelations').KnowledgeId;
    const assignmentTarget = (target: PhpAstValue, hint: string, source: ReturnType<typeof semanticSource.create>): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = knowledgeId(source, 'reference', target.kind);
        const handlers: Readonly<Record<string, () => import('./semanticKnowledgeDataFlowRelations').KnowledgeId>> = {
            variable: () => semanticVariable(target.name, source),
            property: () => {
                const receiver = expression(target.receiver, `${id}:receiver`);
                const accessId = add({ kind: 'access', value: { id, receiver, member: { kind: 'identifier', value: semanticIdentifier.create(target.property) }, mode: semanticAccessMode('direct'), source } });
                // Assignment-target access is modeled by the enclosing assignment effect.

                relate(accessId, receiver, 'depends_on', 'receiver');
                return accessId;
            },
            array_element: () => {
                const receiver = expression(target.target, `${id}:target`);
                const index = expression(target.index, `${id}:index`);
                const accessId = add({ kind: 'access', value: { id, receiver, member: { kind: 'knowledge-id', value: index }, mode: semanticAccessMode('direct'), source } });
                // Assignment-target access is modeled by the enclosing assignment effect.

                relate(accessId, receiver, 'depends_on', 'receiver');
                relate(accessId, index, 'depends_on', 'index');
                return accessId;
            },
        };
        return relationOptionFold(relationFirstOption(Object.entries(handlers), entry => relationEqual(entry[0], target.kind)), () => add({ kind: 'unsupported-expression', value: { id, reason: semanticText.create('unsupported-assignment-target'), source } }), entry => entry[1]());
    };
    expression = createPhpAstExpressionProjector({
        evidenceSourceOf,
        add,
        recordModRefFact,
        recordModRefRelation,
        recordModRefRelations,
        relate,
        semanticVariable,
        semanticValueKind,
        semanticAccessMode,
        semanticOperator,
        semanticAssignmentOperator,
        semanticAssignmentReference,
        semanticIdentifier,
        semanticOperation,
        semanticOutcomeRole,
        semanticPredicateMeaning,
        semanticMatchMode,
        semanticPresent,
        semanticAbsent,
        literalValue,
        predicate,
        outcome,
        match,
        visit: (...args) => visit(...args),
        assignmentTarget,
        knowledgeIdKey,
        castKnowledge: SEMANTIC_CAST_KNOWLEDGE,
    });
    const binding = (variable: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, value: import('./semanticKnowledgeDataFlowRelations').SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId>, origin: import('./semanticKnowledgeDataFlowRelations').SemanticBindingOriginCode, availability: import('./semanticKnowledgeDataFlowRelations').SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId>, source: ReturnType<typeof semanticSource.create>, slot: string): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = knowledgeId(source, 'binding', slot);
        const bindingId = add({ kind: 'binding', value: { id, variable, value, origin: semanticBindingOrigin(origin), availability, source } });
        visitRelation(expand([
            relationResolve(relationEqual(value.kind, 'present'), () => [{ dependency: value.value, role: 'value' }], () => []),
            relationResolve(relationEqual(availability.kind, 'present'), () => [{ dependency: availability.value, role: 'availability' }], () => []),
        ], item => item), entry => relate(bindingId, entry.dependency, 'depends_on', entry.role));
        relate(bindingId, variable, 'depends_on', 'target');
        return bindingId;
    };
    visit = (current: PhpBlock, scopeHint: string, availability: import('./semanticKnowledgeDataFlowRelations').SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId> = semanticAbsent('not_applicable')): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const previousScopeKey = currentScopeKey;
        currentScopeKey = scopeHint;
        const firstStatement = relationFirstOption(current.statements, () => true);
        const lastStatement = relationFirstOption([...current.statements].reverse(), () => true);
        const scopeStart = relationOptionFold(firstStatement, () => 0, statement => statement.source.startOffset);
        const scopeEnd = relationOptionFold(lastStatement, () => scopeStart, statement => statement.source.endOffset);
        const scopeSource = semanticSource.createForFile(sourceFile, scopeStart, scopeEnd, evidenceProvider);
        const scopeId = knowledgeId(scopeSource, 'scope', scopeHint);
        const members: import('./semanticKnowledgeDataFlowRelations').KnowledgeId[] = [];
        visitRelation(current.statements, (statement: PhpStatement, index) => {
            const statementSource = evidenceSourceOf(statement);
            const base = knowledgeId(statementSource, 'value', String(index));
            const semanticAnchors = phpStatementSyntaxEvidenceProjection.project(statement, {
                base,
                availability,
                evidenceSourceOf,
                knowledgeIdKey,
                expression,
                predicate,
                match,
                visit,
                add,
                recordModRefFact,
                recordModRefRelation,
                recordModRefRelations,
                relate,
                binding,
                assignmentTarget,
                semanticIdentifier,
                semanticPresent,
                semanticAbsent,
                semanticValueKind,
                semanticAssignmentOperator,
                semanticAssignmentReference,
                semanticBindingOrigin,
                semanticPredicateMeaning,
                semanticMatchMode,
                semanticEmission: (code: string) => SEMANTIC_EMISSION_KNOWLEDGE.find(item => relationEqual(item.code, code))!,
                semanticInclude: (code: string) => SEMANTIC_INCLUDE_KNOWLEDGE.find(item => relationEqual(item.code, code))!,
                semanticOutcomeRole,
            });
            visitRelation(semanticAnchors, anchor => members.push(anchor));
        });
        add({ kind: 'scope', value: { id: scopeId, source: semanticPresent(scopeSource) } });
        visitRelation(members, member => relate(scopeId, member, 'depends_on', 'member'));
        currentScopeKey = previousScopeKey;
        return scopeId;
    };
    visit(block, 'root');
    const canonicalDataFlow = Object.freeze(dataFlow);
    const relations = Object.freeze(project(canonicalDataFlow, flow => semanticEdge.create(flow.source, flow.target, relationResolve(relationEqual(flow.kind, 'dependency'), () => 'depends_on', () => 'flows_to'), flow.role.code)));
    const factsSnapshot = Object.freeze(facts);
    const semanticRelations = compileSemanticEvidenceRelations({ facts: factsSnapshot, dataFlow: canonicalDataFlow });
    const semanticClosure = buildSemanticCompilationArtifact(semanticRelations).closure;
    const model = Object.freeze({
        facts: factsSnapshot,
        modRefFacts: Object.freeze(modRefFacts),
        modRefRelations: Object.freeze(modRefRelations),
        dataFlow: canonicalDataFlow,
        semanticRelations,
        semanticClosure,
        relations,
    });
    const validation = validateSemanticKnowledgeDataFlow(model);
    return validation.kind === 'valid'
        ? Object.freeze({ kind: 'produced', knowledge: model })
        : Object.freeze({ kind: 'blocked', knowledge: model, violations: validation.violations });
  },
  produce: (input: PhpAstSemanticKnowledgeDataFlowProductionInput): SemanticKnowledgeDataFlow => {
    const outcome = phpAstSemanticKnowledgeDataFlowProductionOperation.produceWithOutcome(input);
    return outcome.kind === 'produced'
        ? outcome.knowledge
        : semanticKnowledgeDataFlowWiring.continueAfterValidation({
            kind: 'invalid',
            dataFlow: outcome.knowledge,
            violations: outcome.violations,
          });
  },
});

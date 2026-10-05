import { relationResolve } from '../../../relational/sequence';
import { project, retain, expand, accumulate, visit } from './semanticRelationalCollections';
import { projectRelation, visitRelation } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold, relationIsPresent, type RelationOption } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import type { PhpAstValue, PhpBlock } from '../phpAstTypes';
import { compileSemanticEvidenceRelations } from './semanticEvidenceRelationCompiler';
import { createPhpAstExpressionProjector } from './phpAstExpressionSyntaxEvidenceRegistry';
import { buildSemanticCompilationArtifact } from './semanticCompilationArtifact';
import type { PhpStatement } from '../phpAstTypes';
import { projectPhpStatementSyntaxEvidence } from './phpAstStatementSyntaxEvidenceRegistry';
import { type SemanticFact, type SemanticKnowledgeDataFlow, type SemanticDataFlowFact, type SemanticOperatorCode, type SemanticDataFlowRelationCode, type SemanticDataFlowRoleCode, type SemanticLiteral, type SemanticPresence, semanticDependency, semanticValueFlow, semanticEdge, semanticFact, semanticSource, SEMANTIC_EVIDENCE_PROVIDER_KNOWLEDGE, semanticText, semanticNumber, semanticBoolean, knowledgeId, knowledgeIdKey, semanticIdentifier, semanticOperation, semanticPresent, semanticAbsent, SEMANTIC_VALUE_KIND_KNOWLEDGE, SEMANTIC_OUTCOME_ROLE_KNOWLEDGE, SEMANTIC_ACCESS_MODE_KNOWLEDGE, SEMANTIC_OPERATOR_INDEX, SEMANTIC_CAST_KNOWLEDGE, SEMANTIC_EMISSION_KNOWLEDGE, SEMANTIC_INCLUDE_KNOWLEDGE, SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE, SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE, SEMANTIC_BINDING_ORIGIN_KNOWLEDGE, SEMANTIC_PREDICATE_MEANING_KNOWLEDGE, SEMANTIC_MATCH_MODE_KNOWLEDGE, validateSemanticKnowledgeDataFlow, } from './semanticKnowledgeDataFlowRelations';
const sourceOf = (value: {
    readonly source: {
        readonly startOffset: number;
        readonly endOffset: number;
    };
}, filePath: string, evidenceProviderCode: import('./semanticKnowledgeDataFlowRelations').SemanticEvidenceProviderCode = 'parser') => semanticSource(filePath, value.source.startOffset, value.source.endOffset, SEMANTIC_EVIDENCE_PROVIDER_KNOWLEDGE.find(item => relationEqual(item.code, evidenceProviderCode))!);
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
                string: item => ({ kind: 'string', value: semanticText(String(item)) }),
                number: item => ({ kind: 'number', value: semanticNumber(Number(item)) }),
                boolean: item => ({ kind: 'boolean', value: semanticBoolean(Boolean(item)) }),
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
export function producePhpAstSemanticKnowledgeDataFlow(block: PhpBlock, filePath = '<php-source>', evidenceProviderCode: import('./semanticKnowledgeDataFlowRelations').SemanticEvidenceProviderCode = 'parser'): SemanticKnowledgeDataFlow {
    const evidenceSourceOf = (value: {
        readonly source: {
            readonly startOffset: number;
            readonly endOffset: number;
        };
    }) => sourceOf(value, filePath, evidenceProviderCode);
    const facts: SemanticFact[] = [];
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
    const relate = (from: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, to: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, relation: SemanticDataFlowRelationCode, role: SemanticDataFlowRoleCode, guard?: import('./semanticKnowledgeDataFlowRelations').SemanticFlowGuard): void => {
        const candidateRelations = retain([
            relationResolve(
                relationEqual(knowledgeIdKey(from), knowledgeIdKey(to)),
                () => semanticAbsent('not_applicable'),
                () => semanticPresent(relationResolve(relationEqual(relation, 'depends_on'), () => semanticDependency(from, to, role, guard), () => semanticValueFlow(from, to, role, guard))),
            ),
        ], item => relationIsPresent(item));
        projectRelation(candidateRelations, item => { dataFlow.push(item); return item; });
    };
    const outcome = (id: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, role: import('./semanticKnowledgeDataFlowRelations').SemanticOutcomeRoleCode, value: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, source: ReturnType<typeof semanticSource>): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const outcomeId = add({ kind: 'outcome', value: { id, role: semanticOutcomeRole(role), value: semanticPresent(value), source } });
        relate(outcomeId, value, 'depends_on', 'value');
        return outcomeId;
    };
    /**
     * Elevate a boolean/guard expression into semantic knowledge. The expression
     * remains evidence of the predicate, but the predicate itself becomes a
     * first-class fact consumed by relational closure.
     */
    const predicate = (expressionId: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, source: ReturnType<typeof semanticSource>, meaning: import('./semanticKnowledgeDataFlowRelations').SemanticPredicateMeaningCode = 'boolean_evaluation', slot = 'self'): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = knowledgeId(source, 'predicate', slot);
        const predicateId = add({ kind: 'predicate', value: { id, meaning: semanticPredicateMeaning(meaning), expression: expressionId, source } });
        relate(predicateId, expressionId, 'depends_on', 'value');
        return predicateId;
    };
    const match = (subject: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, candidate: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, mode: import('./semanticKnowledgeDataFlowRelations').SemanticMatchModeCode, source: ReturnType<typeof semanticSource>, slot: string): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = knowledgeId(source, 'match', slot);
        const matchId = add({ kind: 'match', value: { id, mode: semanticMatchMode(mode), subject, candidate, source } });
        relate(matchId, subject, 'depends_on', 'subject');
        relate(matchId, candidate, 'depends_on', 'candidate');
        return matchId;
    };
    let visit: (current: PhpBlock, scopeHint: string, availability?: import('./semanticKnowledgeDataFlowRelations').SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId>) => import('./semanticKnowledgeDataFlowRelations').KnowledgeId;
    const semanticVariable = (name: string, source: ReturnType<typeof semanticSource>): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const key = `${currentScopeKey}:${name}`;
        return relationOptionFold(relationFirstOption(variableIndex, ([candidate]) => relationEqual(candidate, key)), () => {
            const id = knowledgeId(semanticSource(filePath, source.span.start.value, source.span.end.value), 'variable', key);
            variableIndex = [...retain(variableIndex, ([candidate]) => relationNotEqual(candidate, key)), [key, id] as const];
            add({ kind: 'variable', value: { id, name: semanticIdentifier(name), scope: knowledgeId(semanticSource(filePath, 0, 0), 'scope', currentScopeKey), source } });
            return id;
        }, ([, value]) => value);
    };
    let expression: (value: PhpAstValue, hint: string) => import('./semanticKnowledgeDataFlowRelations').KnowledgeId;
    const assignmentTarget = (target: PhpAstValue, hint: string, source: ReturnType<typeof semanticSource>): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
        const id = knowledgeId(source, 'reference', target.kind);
        const handlers: Readonly<Record<string, () => import('./semanticKnowledgeDataFlowRelations').KnowledgeId>> = {
            variable: () => semanticVariable(target.name, source),
            property: () => {
                const receiver = expression(target.receiver, `${id}:receiver`);
                const accessId = add({ kind: 'access', value: { id, receiver, member: { kind: 'identifier', value: semanticIdentifier(target.property) }, mode: semanticAccessMode('direct'), source } });
                relate(accessId, receiver, 'depends_on', 'receiver');
                return accessId;
            },
            array_element: () => {
                const receiver = expression(target.target, `${id}:target`);
                const index = expression(target.index, `${id}:index`);
                const accessId = add({ kind: 'access', value: { id, receiver, member: { kind: 'knowledge-id', value: index }, mode: semanticAccessMode('direct'), source } });
                relate(accessId, receiver, 'depends_on', 'receiver');
                relate(accessId, index, 'depends_on', 'index');
                return accessId;
            },
        };
        return relationOptionFold(relationFirstOption(Object.entries(handlers), entry => relationEqual(entry[0], target.kind)), () => add({ kind: 'unsupported-expression', value: { id, reason: semanticText('unsupported-assignment-target'), source } }), entry => entry[1]());
    };
    expression = createPhpAstExpressionProjector({
        evidenceSourceOf,
        add,
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
    const binding = (variable: import('./semanticKnowledgeDataFlowRelations').KnowledgeId, value: import('./semanticKnowledgeDataFlowRelations').SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId>, origin: import('./semanticKnowledgeDataFlowRelations').SemanticBindingOriginCode, availability: import('./semanticKnowledgeDataFlowRelations').SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId>, source: ReturnType<typeof semanticSource>, slot: string): import('./semanticKnowledgeDataFlowRelations').KnowledgeId => {
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
        const scopeSource = semanticSource(filePath, scopeStart, scopeEnd);
        const scopeId = knowledgeId(scopeSource, 'scope', scopeHint);
        const members: import('./semanticKnowledgeDataFlowRelations').KnowledgeId[] = [];
        visitRelation(current.statements, (statement: PhpStatement, index) => {
            const statementSource = evidenceSourceOf(statement);
            const base = knowledgeId(statementSource, 'value', String(index));
            const semanticAnchors = projectPhpStatementSyntaxEvidence(statement, {
                base,
                availability,
                evidenceSourceOf,
                knowledgeIdKey,
                expression,
                predicate,
                match,
                visit,
                add,
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
        add({ kind: 'scope', value: { id: scopeId, source: relationResolve(scopeSource, () => semanticPresent(scopeSource), () => semanticAbsent('not_provided')) } });
        visitRelation(members, member => relate(scopeId, member, 'depends_on', 'member'));
        currentScopeKey = previousScopeKey;
        return scopeId;
    };
    visit(block, 'root');
    const canonicalDataFlow = Object.freeze(dataFlow);
    const relations = Object.freeze(project(canonicalDataFlow, flow => semanticEdge(flow.source, flow.target, relationResolve(relationEqual(flow.kind, 'dependency'), () => 'depends_on', () => 'flows_to'), flow.role.code)));
    const factsSnapshot = Object.freeze(facts);
    const semanticRelations = compileSemanticEvidenceRelations({ facts: factsSnapshot, dataFlow: canonicalDataFlow });
    const semanticClosure = buildSemanticCompilationArtifact(semanticRelations).closure;
    const model = Object.freeze({
        facts: factsSnapshot,
        dataFlow: canonicalDataFlow,
        semanticRelations,
        semanticClosure,
        relations,
    });
    validateSemanticKnowledgeDataFlow(model);
    return model;
}

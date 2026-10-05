import type { PhpArgument, PhpBlock, PhpAstValue } from '../phpAstTypes';
import type { PhpStatement } from '../phpAstStatementTypes';
import type { SemanticFact, SemanticPresence, KnowledgeId, SemanticDataFlowRelationCode, SemanticDataFlowRoleCode, SemanticBindingOriginCode, SemanticValueKindCode, SemanticValueKindDefinition, SemanticAssignmentOperatorCode, SemanticAssignmentOperatorDefinition, SemanticAssignmentReferenceCode, SemanticAssignmentReferenceDefinition, SemanticPredicateMeaningCode, SemanticMatchModeCode, SemanticMatchModeDefinition, SemanticEmissionCode, SemanticEmissionDefinition, SemanticIncludeCode, SemanticIncludeDefinition, SemanticOutcomeRoleCode, SemanticOutcomeRoleDefinition, SemanticAbsenceReasonCode, SemanticBindingOriginDefinition } from './semanticKnowledgeDataFlowRelations';
import { SEMANTIC_EMISSION_KNOWLEDGE, SEMANTIC_INCLUDE_KNOWLEDGE, knowledgeId } from './semanticKnowledgeDataFlowRelations';
import { matchPhpStatement } from '../phpAstAlgebra';
import type { semanticSource } from './semanticKnowledgeDataFlowRelations';
import { PHP_STATEMENT_KINDS } from '../phpAstStatementKinds';
import { relationResolve, projectRelation } from '../../../relational/sequence';
import { relationFirstOption, relationOptionFold, relationRefine } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual, relationNotEqual, relationNone, relationSome } from '../../../../semantic/foundation/semanticRelations';

/**
 * Declarative syntax-evidence registry for statement-shaped PHP input.
 *
 * This is the isolated grammar/evidence authority. Concrete parser spellings
 * are intentionally confined here. The semantic adapter consumes only the
 * registry contract and therefore cannot make source statement kinds part of
 * the canonical semantic ontology.
 */
type EvidenceCode = string;
type EvidenceRelation = SemanticDataFlowRelationCode;
type EvidenceRole = SemanticDataFlowRoleCode;
type EvidenceOrigin = SemanticBindingOriginCode;
type EvidenceValueKind = SemanticValueKindCode;
type EvidenceAssignmentOperator = SemanticAssignmentOperatorCode;
type EvidenceAssignmentReference = SemanticAssignmentReferenceCode;
type EvidencePredicateMeaning = SemanticPredicateMeaningCode;
type EvidenceMatchMode = SemanticMatchModeCode;
type EvidenceEmission = SemanticEmissionCode;
type EvidenceInclude = SemanticIncludeCode;
type EvidenceOutcomeRole = SemanticOutcomeRoleCode;

export interface PhpStatementSemanticEvidenceContext {
  readonly base: KnowledgeId;
  readonly availability: SemanticPresence<KnowledgeId>;
  readonly evidenceSourceOf: (value: { readonly source: { readonly startOffset: number; readonly endOffset: number } }) => ReturnType<typeof semanticSource>;
  readonly knowledgeIdKey: (id: KnowledgeId) => string;
  readonly expression: (value: PhpAstValue, hint: string) => KnowledgeId;
  readonly predicate: (expressionId: KnowledgeId, source: ReturnType<typeof semanticSource>, meaning?: EvidencePredicateMeaning, slot?: string) => KnowledgeId;
  readonly match: (subject: KnowledgeId, candidate: KnowledgeId, mode: EvidenceMatchMode, source: ReturnType<typeof semanticSource>, slot: string) => KnowledgeId;
  readonly visit: (block: PhpBlock, scopeHint: string, availability?: SemanticPresence<KnowledgeId>) => KnowledgeId;
  readonly add: (fact: SemanticFact) => KnowledgeId;
  readonly relate: (from: KnowledgeId, to: KnowledgeId, relation: EvidenceRelation, role: EvidenceRole) => void;
  readonly binding: (variable: KnowledgeId, value: SemanticPresence<KnowledgeId>, origin: EvidenceOrigin, availability: SemanticPresence<KnowledgeId>, source: ReturnType<typeof semanticSource>, slot: string) => KnowledgeId;
  readonly assignmentTarget: (target: PhpAstValue, hint: string, source: ReturnType<typeof semanticSource>) => KnowledgeId;
  readonly semanticIdentifier: (value: string) => ReturnType<typeof import('./semanticKnowledgeDataFlowRelations').semanticIdentifier>;
  readonly semanticPresent: <T>(value: T) => SemanticPresence<T>;
  readonly semanticAbsent: <T>(reason: SemanticAbsenceReasonCode) => SemanticPresence<T>;
  readonly semanticValueKind: (code: SemanticValueKindCode) => SemanticValueKindDefinition;
  readonly semanticAssignmentOperator: (code: SemanticAssignmentOperatorCode) => SemanticAssignmentOperatorDefinition;
  readonly semanticAssignmentReference: (code: SemanticAssignmentReferenceCode) => SemanticAssignmentReferenceDefinition;
  readonly semanticBindingOrigin: (code: EvidenceOrigin) => SemanticBindingOriginDefinition;
  readonly semanticPredicateMeaning: (code: EvidencePredicateMeaning) => import('./semanticKnowledgeDataFlowRelations').SemanticPredicateMeaningDefinition;
  readonly semanticMatchMode: (code: EvidenceMatchMode) => SemanticMatchModeDefinition;
  readonly semanticEmission: (code: EvidenceEmission) => SemanticEmissionDefinition;
  readonly semanticInclude: (code: EvidenceInclude) => SemanticIncludeDefinition;
  readonly semanticOutcomeRole: (code: EvidenceOutcomeRole) => SemanticOutcomeRoleDefinition;
}

const relationCase = <T, R>(value: T, key: (value: T) => string, cases: Readonly<Record<string, (value: T) => R>>, fallback: (value: T) => R): R => relationOptionFold(relationFirstOption(Object.entries(cases), ([candidate]) => relationEqual(candidate, key(value))), () => fallback(value), ([, branch]) => branch(value));

export function projectPhpStatementSyntaxEvidence(
  statement: PhpStatement,
  context: PhpStatementSemanticEvidenceContext,
): readonly KnowledgeId[] {
  const {
    base, availability, evidenceSourceOf, knowledgeIdKey, expression, predicate, match, visit, add, relate, binding,
    assignmentTarget, semanticIdentifier, semanticPresent, semanticAbsent, semanticValueKind, semanticAssignmentOperator,
    semanticAssignmentReference, semanticBindingOrigin, semanticPredicateMeaning, semanticMatchMode, semanticEmission,
    semanticInclude, semanticOutcomeRole,
  } = context;
  const anchors: KnowledgeId[] = [];
  const emit = (id: KnowledgeId): void => { anchors.push(id); };
  matchPhpStatement(statement, {

expression_statement: value => { emit(expression(value.expression, `${knowledgeIdKey(base)}:expression`)); },
assignment: value => {
  const valueId = expression(value.value, `${knowledgeIdKey(base)}:value`);
  const target = assignmentTarget(value.target, `${knowledgeIdKey(base)}:target`, evidenceSourceOf(value));
  const assignmentSource = evidenceSourceOf(value);
  const id = add({ kind: 'assignment', value: { id: base, target, value: valueId, operator: semanticAssignmentOperator(value.operator.kind), reference: semanticAssignmentReference(value.reference.kind), source: assignmentSource } });
  const bindingId = binding(target, semanticPresent(valueId), 'assignment', availability, assignmentSource, 'value');
  relate(id, valueId, 'depends_on', 'value');
  relate(id, target, 'depends_on', 'target');
  relate(id, bindingId, 'depends_on', 'member');
  relate(valueId, target, 'flows_to', 'target');
  emit(id);
},
return_with_value: value => {
  const valueId = expression(value.expression, `${knowledgeIdKey(base)}:emitted-result`);
  const id = add({ kind: 'emission', value: { id: base, definition: SEMANTIC_EMISSION_KNOWLEDGE.find(item => relationEqual(item.code, 'result'))!, value: semanticPresent(valueId), source: evidenceSourceOf(value) } });
  relate(id, valueId, 'depends_on', 'emitted_value');
  emit(id);
},
return_void: value => { emit(add({ kind: 'emission', value: { id: base, definition: SEMANTIC_EMISSION_KNOWLEDGE.find(item => relationEqual(item.code, 'result'))!, value: semanticAbsent('void_emission'), source: evidenceSourceOf(value) } })); },
unset_statement: value => {
  const targets = projectRelation(value.targets, (target, targetIndex) => assignmentTarget(target, `${knowledgeIdKey(base)}:unset:${targetIndex}`, evidenceSourceOf(value)));
  const id = add({ kind: 'unset', value: { id: base, targets, source: evidenceSourceOf(value) } });
  projectRelation(targets, target => { relate(id, target, 'depends_on', 'target'); return target; });
  emit(id);
},
include_statement: value => {
  const expressionId = expression(value.expression, `${knowledgeIdKey(base)}:include`);
  const definition = SEMANTIC_INCLUDE_KNOWLEDGE.find(item => relationEqual(item.code, value.includeKind.kind))!;
  const id = add({ kind: 'include', value: { id: base, definition, expression: expressionId, source: evidenceSourceOf(value) } });
  relate(id, expressionId, 'depends_on', 'value');
  emit(id);
},
throw_statement: value => {
  const valueId = expression(value.expression, `${knowledgeIdKey(base)}:emitted-exception`);
  const id = add({ kind: 'emission', value: { id: base, definition: SEMANTIC_EMISSION_KNOWLEDGE.find(item => relationEqual(item.code, 'exception'))!, value: semanticPresent(valueId), source: evidenceSourceOf(value) } });
  relate(id, valueId, 'depends_on', 'emitted_value');
  emit(id);
},
[PHP_STATEMENT_KINDS.conditional]: value => {
  const predicateExpression = expression(value.condition, `${knowledgeIdKey(base)}:predicate`);
  const predicateId = predicate(predicateExpression, evidenceSourceOf(value));
  const region = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
  const thenRegion = visit(value.thenBlock, `${knowledgeIdKey(base)}:then`, semanticPresent(region));
  relate(region, predicateId, 'depends_on', 'predicate');
  relate(region, thenRegion, 'depends_on', 'body');
  relationOptionFold(relationRefine(value.alternative, (candidate): candidate is Extract<typeof value.alternative, { readonly kind: 'else_block' }> => relationEqual(candidate.kind, 'else_block')), () => false, current => { const elseRegion = visit(current.block, `${knowledgeIdKey(base)}:else`, semanticPresent(region)); relate(region, elseRegion, 'depends_on', 'body'); return true; });
  relationOptionFold(relationRefine(value.alternative, (candidate): candidate is Extract<typeof value.alternative, { readonly kind: 'else_if' }> => relationEqual(candidate.kind, 'else_if')), () => false, current => { const elseRegion = visit({ kind: 'block', statements: [current.statement] }, `${knowledgeIdKey(base)}:else-if`, semanticPresent(region)); relate(region, elseRegion, 'depends_on', 'body'); return true; });
  emit(region);
},
[PHP_STATEMENT_KINDS.preTestRecurrence]: value => {
  const predicateExpression = expression(value.condition, `${knowledgeIdKey(base)}:predicate`);
  const predicateId = predicate(predicateExpression, evidenceSourceOf(value));
  const region = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
  const body = visit(value.body, `${knowledgeIdKey(base)}:body`, semanticPresent(region));
  relate(region, predicateId, 'depends_on', 'predicate');
  relate(region, body, 'depends_on', 'body');
  // The body is semantically dependent on the region and the region is
  // dependent on the body: recurrence is inferred from relational
  // closure, never from a loop node.
  relate(body, region, 'depends_on', 'body');
  emit(region);
},
[PHP_STATEMENT_KINDS.collectionRecurrence]: value => {
  const iterable = expression(value.iterable, `${knowledgeIdKey(base)}:iterable`);
  const target = knowledgeId(evidenceSourceOf(value), 'value', 'target');
  const targetFact = relationOptionFold(relationRefine(value.target, (candidate): candidate is Extract<typeof value.target, { readonly kind: 'value' }> => relationEqual(candidate.kind, 'value')), () => { throw Error('unreachable assignment-target relation'); }, current => add({ kind: 'value', value: { id: target, kind: semanticValueKind('variable'), name: semanticPresent(semanticIdentifier(current.variable)), value: semanticAbsent('not_applicable'), source: evidenceSourceOf(value) } }));
  const targetFactResolved = relationOptionFold(relationRefine(value.target, (candidate): candidate is Extract<typeof value.target, { readonly kind: 'key_value' }> => relationEqual(candidate.kind, 'key_value')), () => targetFact, current => add({ kind: 'value', value: { id: target, kind: semanticValueKind('variable'), name: semanticPresent(semanticIdentifier(current.value)), value: semanticAbsent('not_applicable'), source: evidenceSourceOf(value) } }));
  const region = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
  const body = visit(value.body, `${knowledgeIdKey(base)}:body`, semanticPresent(region));
  const bindingId = binding(targetFactResolved, semanticPresent(iterable), 'iteration', semanticPresent(region), evidenceSourceOf(value), 'iteration');
  relate(region, iterable, 'depends_on', 'iterable');
  relate(region, bindingId, 'depends_on', 'binding');
  relate(region, body, 'depends_on', 'body');
  relate(body, region, 'depends_on', 'body');
  emit(region);
},
[PHP_STATEMENT_KINDS.countedRecurrence]: value => {
  const clauseExpression = (clause: typeof value.initializer, hint: string): import('../../../../semantic/foundation/relationalSequence').RelationOption<KnowledgeId> => relationCase(clause, current => current.kind, {
    empty: () => relationNone(),
    expression: current => relationSome(expression(current.value, hint)),
  }, current => relationSome(expression(current.value, `${hint}:value`)));
  const initializer = clauseExpression(value.initializer, `${knowledgeIdKey(base)}:initializer`);
  const predicateExpression = clauseExpression(value.condition, `${knowledgeIdKey(base)}:predicate`);
  const update = clauseExpression(value.update, `${knowledgeIdKey(base)}:update`);
  const conditionPredicate = relationOptionFold(predicateExpression, relationNone, current => relationSome(predicate(current, evidenceSourceOf(value))));
  const region = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
  const body = visit(value.body, `${knowledgeIdKey(base)}:body`, semanticPresent(region));
  relationOptionFold(initializer, () => true, current => { relate(region, current, 'depends_on', 'initializer'); return true; });
  relationOptionFold(conditionPredicate, () => true, current => { relate(region, current, 'depends_on', 'predicate'); return true; });
  relationOptionFold(update, () => true, current => { relate(region, current, 'depends_on', 'update'); return true; });
  relate(region, body, 'depends_on', 'body');
  relate(body, region, 'depends_on', 'body');
  emit(region);
},
[PHP_STATEMENT_KINDS.multiCandidateDispatch]: value => {
  const subject = expression(value.subject, `${knowledgeIdKey(base)}:subject`);
  const region = add({ kind: 'region', value: { id: base, source: evidenceSourceOf(value) } });
  relate(region, subject, 'depends_on', 'subject');
  projectRelation(value.cases, (item, caseIndex) => {
    const caseRegion = visit(item.body, `${knowledgeIdKey(base)}:case:${caseIndex}`, semanticPresent(region));
    relate(region, caseRegion, 'depends_on', 'candidate');
    relationCase(item, current => current.kind, {
      case: current => projectRelation(current.labels, (label, labelIndex) => {
        const candidate = expression(label, `${knowledgeIdKey(base)}:case:${caseIndex}:label:${labelIndex}:candidate`);
        const matchId = match(subject, candidate, 'loose', evidenceSourceOf(item), `case:${caseIndex}:${labelIndex}`);
        const predicateId = predicate(matchId, evidenceSourceOf(item), 'match', `case:${caseIndex}:${labelIndex}`);
        relate(region, predicateId, 'depends_on', 'predicate');
        relate(region, caseRegion, 'depends_on', 'candidate');
        return predicateId;
      }),
    }, () => false);
    return caseRegion;
  });
  emit(region);
},
try_statement: value => {
  const boundaryAvailability = semanticPresent(base);
  const tryBody = visit(value.body, `${knowledgeIdKey(base)}:try`, boundaryAvailability);
  const catchHandlers = projectRelation(value.catches, (item, catchIndex) => {
    const handlerSource = evidenceSourceOf(item);
    const handlerId = knowledgeId(handlerSource, 'exception-handler', String(catchIndex));
    const catchBody = visit(item.body, `${knowledgeIdKey(base)}:catch:${catchIndex}`, semanticPresent(handlerId));
    const catchType = add({ kind: 'value', value: { id: knowledgeId(evidenceSourceOf(item), 'value', `catch:${catchIndex}:type`), kind: semanticValueKind('constant'), name: semanticPresent(semanticIdentifier(item.exceptionType)), value: semanticAbsent('not_applicable'), source: evidenceSourceOf(item) } });
    const handler = add({
      kind: 'exception-handler',
      value: {
        id: handlerId,
        exceptionType: catchType,
        variable: semanticPresent(semanticIdentifier(item.variable)),
        body: catchBody,
        source: handlerSource,
      },
    });
    const variable = add({ kind: 'value', value: { id: knowledgeId(handlerSource, 'value', `catch:${catchIndex}:variable`), kind: semanticValueKind('variable'), name: semanticPresent(semanticIdentifier(item.variable)), value: semanticAbsent('not_applicable'), source: handlerSource } });
    const variableBinding = binding(variable, semanticAbsent('not_provided'), 'exception_handler', semanticPresent(handler), handlerSource, `catch:${catchIndex}`);
    relate(handler, variableBinding, 'depends_on', 'binding');
    relate(handler, catchType, 'depends_on', 'exception_type');
    relate(handler, catchBody, 'depends_on', 'body');
    return handler;
  });
  const finallyBlock: SemanticPresence<import('./semanticKnowledgeDataFlowRelations').KnowledgeId> = relationOptionFold(relationRefine(value.finallyBlock, (candidate): candidate is Extract<typeof value.finallyBlock, { readonly kind: 'present' }> => relationEqual(candidate.kind, 'present')), () => semanticAbsent('not_provided'), current => semanticPresent(visit(current.block, `${knowledgeIdKey(base)}:finally`, boundaryAvailability)));
  const boundary = add({ kind: 'exception', value: { id: base, body: tryBody, catches: catchHandlers, finallyBlock, source: evidenceSourceOf(value) } });
  relate(boundary, tryBody, 'depends_on', 'body');
  projectRelation(catchHandlers, handler => { relate(boundary, handler, 'depends_on', 'handler'); return handler; });
  relationOptionFold(relationRefine(finallyBlock, (candidate): candidate is Extract<typeof finallyBlock, { readonly kind: 'present' }> => relationEqual(candidate.kind, 'present')), () => false, current => { relate(boundary, current.value, 'depends_on', 'finally_block'); return true; });
  emit(boundary);
},
  });
  return Object.freeze(anchors);
}

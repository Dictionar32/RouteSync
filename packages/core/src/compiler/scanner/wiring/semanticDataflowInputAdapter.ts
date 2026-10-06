/** Converts scanner-local semantic knowledge into the canonical upstream dataflow input. */
import type { SourceSpan } from '../../../types/upstream/provenance';
import type {
  SemanticDataflowEntityRole,
  SemanticDataflowIdentity,
  SemanticDataflowInput,
  SemanticDataflowRole,
  SemanticDataflowGuard,
  semanticDataflowFactWithLineage,
} from '../../../types/upstream/semanticDataflow';
import { stringValue, numberValue } from '../../../types/upstream/valueObjects';
import type { SemanticDataFlowFact, SemanticKnowledgeDataFlow, SemanticDataFlowRoleCode } from '../lexer/routeAst/semanticKnowledgeDataFlowRelations';
import { relationEqual, relationOptionFold, relationFirstOption } from '../../../semantic/foundation/semanticRelations';
import { relationVariantFold } from '../../../semantic/foundation/relationalSequence';

const ROLE_CATALOG: readonly SemanticDataflowRole[] = Object.freeze([
  'operator', 'operand_left', 'operand_right', 'operand', 'receiver', 'index', 'part', 'argument', 'callable',
  'array_key', 'array_value', 'class_expression', 'value', 'predicate', 'alternative', 'subject', 'candidate',
  'body', 'initializer', 'update', 'iterable', 'target', 'binding', 'emitted_value', 'exception_type', 'handler',
  'finally_block', 'member', 'availability',
]);

const ENTITY_ROLE_CATALOG: readonly SemanticDataflowEntityRole[] = Object.freeze([
  'variable', 'value', 'operator', 'comparison', 'binary-operation', 'unary-operation', 'predicate', 'merge',
  'match', 'outcome', 'assignment', 'binding', 'reference', 'callable', 'invocation', 'access', 'cast', 'array',
  'static-invocation', 'construction', 'type-check', 'class-reference', 'class-constant', 'resource-access',
  'interpolated-string', 'magic-constant', 'closure', 'arrow-function', 'anonymous-class', 'unsupported-expression',
  'emission', 'include', 'unset', 'region', 'exception-handler', 'exception', 'scope',
]);

const role = (value: SemanticDataFlowRoleCode): SemanticDataflowRole =>
  relationOptionFold(relationFirstOption(ROLE_CATALOG, candidate => relationEqual(candidate, value)), () => 'value', candidate => candidate);

const entityRole = (value: SemanticDataflowEntityRole): SemanticDataflowEntityRole =>
  relationOptionFold(relationFirstOption(ENTITY_ROLE_CATALOG, candidate => relationEqual(candidate, value)), () => 'value', candidate => candidate);

const identity = (factIdentity: SemanticDataFlowFact['source']): SemanticDataflowIdentity => {
  const source: SourceSpan = Object.freeze({
    kind: 'source_span',
    file: Object.freeze({ kind: 'source_file', value: stringValue(factIdentity.identity.source.filePath.value) }),
    start: numberValue(factIdentity.identity.source.span.start.value),
    end: numberValue(factIdentity.identity.source.span.end.value),
  });
  return Object.freeze({
    kind: 'semantic_dataflow_identity',
    source,
    role: entityRole(factIdentity.identity.role),
    slot: stringValue(factIdentity.identity.slot.value),
  });
};

const guard = (fact: SemanticDataFlowFact): SemanticDataflowGuard | undefined =>
  relationVariantFold(fact.guard, 'present', () => undefined, value => Object.freeze({ predicate: identity(value.value.predicate), polarity: value.value.polarity }));

const canonicalFact = (fact: SemanticDataFlowFact, producer: 'route' | 'controller') => {
  const canonical = relationEqual(fact.kind, 'dependency')
    ? Object.freeze({ kind: 'dependency' as const, source: identity(fact.source), target: identity(fact.target), role: role(fact.role.code), guard: guard(fact) })
    : Object.freeze({ kind: 'value_flow' as const, source: identity(fact.source), target: identity(fact.target), role: role(fact.role.code), guard: guard(fact) });
  return semanticDataflowFactWithLineage(canonical, producer);
};

export const createSemanticDataflowInput = (
  node: SemanticDataflowIdentity,
  source: SourceSpan,
  knowledge: SemanticKnowledgeDataFlow,
  producer: 'route' | 'controller',
): SemanticDataflowInput => Object.freeze({
  kind: 'semantic_dataflow_input',
  node,
  source,
  facts: Object.freeze(knowledge.dataFlow.map(fact => canonicalFact(fact, producer))),
  origin: Object.freeze({
    kind: 'semantic_dataflow_origin',
    source: 'semantic_dataflow_input',
    identity: node,
    closed: true,
  }),
  closed: true,
});

/** Elevates syntax-neutral semantic knowledge flow into the upstream AST judgment. */
import type { AstNodeIdentity } from '../../types/upstream/ast';
import type {
  AstDataflowFact,
  AstDataflowIdentity,
  AstDataflowInterface,
  AstDataflowJudgment,
  AstDataflowRole,
  AstDataflowEntityRole,
} from '../../types/upstream/astDataflowInterface';
import type { SourceSpan } from '../../types/upstream/provenance';
import { stringValue, numberValue } from '../../types/upstream/valueObjects';
import type { SemanticDataFlowFact, SemanticKnowledgeDataFlow, SemanticDataFlowRoleCode } from '../scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations';
import { relationEqual, relationResolve } from '../../semantic/kernel/semanticRelations';
import { relationFixedPoint, relationProject, relationExpand, relationFirstOption, relationOptionFold, relationVariantFold } from '../../semantic/kernel/relationalSequence';

const ROLE_CATALOG: readonly AstDataflowRole[] = Object.freeze([
  'operator', 'operand_left', 'operand_right', 'operand', 'receiver', 'index',
  'part', 'argument', 'callable', 'array_key', 'array_value', 'class_expression',
  'value', 'predicate', 'alternative', 'subject', 'candidate', 'body', 'initializer',
  'update', 'iterable', 'target', 'binding', 'emitted_value', 'exception_type',
  'handler', 'finally_block', 'member', 'availability',
]);

const ENTITY_ROLE_CATALOG: readonly AstDataflowEntityRole[] = Object.freeze([
  'variable', 'value', 'operator', 'comparison', 'binary-operation', 'unary-operation',
  'predicate', 'merge', 'match', 'outcome', 'assignment', 'binding', 'reference',
  'callable', 'invocation', 'access', 'cast', 'array', 'static-invocation', 'construction',
  'type-check', 'class-reference', 'class-constant', 'resource-access', 'interpolated-string',
  'magic-constant', 'closure', 'arrow-function', 'anonymous-class', 'unsupported-expression',
  'emission', 'include', 'unset', 'region', 'exception-handler', 'exception', 'scope',
]);

const role = (value: SemanticDataFlowRoleCode): AstDataflowRole =>
  relationOptionFold(relationFirstOption(ROLE_CATALOG, candidate => relationEqual(candidate, value)), () => 'value', candidate => candidate);

const entityRole = (value: AstDataflowEntityRole): AstDataflowEntityRole =>
  relationOptionFold(relationFirstOption(ENTITY_ROLE_CATALOG, candidate => relationEqual(candidate, value)), () => 'value', candidate => candidate);

const identity = (id: SemanticDataFlowFact['source']): AstDataflowIdentity => {
  const source: SourceSpan = Object.freeze({
    kind: 'source_span',
    file: Object.freeze({ kind: 'source_file', value: stringValue(id.identity.source.filePath.value) }),
    start: numberValue(id.identity.source.span.start.value),
    end: numberValue(id.identity.source.span.end.value),
  });
  return Object.freeze({
    kind: 'ast_dataflow_identity',
    source,
    role: entityRole(id.identity.role),
    slot: stringValue(id.identity.slot.value),
  });
};

const canonicalFact = (fact: SemanticDataFlowFact): AstDataflowFact => relationResolve(
  relationEqual(fact.kind, 'dependency'),
  () => Object.freeze({ kind: 'dependency', source: identity(fact.source), target: identity(fact.target), role: role(fact.role.code) }),
  () => Object.freeze({ kind: 'value_flow', source: identity(fact.source), target: identity(fact.target), role: role(fact.role.code) }),
);

const identityKey = (value: AstDataflowIdentity): string => JSON.stringify(value);
const factKey = (fact: AstDataflowFact): string => JSON.stringify(fact);

const uniqueFacts = (facts: readonly AstDataflowFact[], index = 0, output: readonly AstDataflowFact[] = []): readonly AstDataflowFact[] =>
  relationResolve(
    relationEqual(index, facts.length),
    () => Object.freeze(output),
    () => uniqueFacts(facts, index + 1, relationOptionFold(
      relationFirstOption(output, candidate => relationEqual(factKey(candidate), factKey(facts[index]))),
      () => Object.freeze([...output, facts[index]]),
      () => output,
    )),
  );

const reachesFrom = (facts: readonly AstDataflowFact[]): readonly AstDataflowFact[] =>
  relationExpand(
    facts,
    fact => relationResolve(
      relationEqual(fact.kind, 'reaches'),
      () => [fact],
      () => [Object.freeze({ kind: 'reaches', source: fact.source, target: fact.target })],
    ),
  );

const transitiveReaches = (facts: readonly AstDataflowFact[]): readonly AstDataflowFact[] =>
  relationExpand(
    facts,
    left => relationExpand(
      facts,
      right => relationResolve(
        relationAllEqual(left, right),
        () => [Object.freeze({ kind: 'reaches', source: left.source, target: right.target })],
        () => [],
      ),
    ),
  );

const relationAllEqual = (left: AstDataflowFact, right: AstDataflowFact): boolean =>
  relationVariantFold<AstDataflowFact, 'reaches', boolean>(
    left,
    'reaches',
    () => false,
    leftReach => relationVariantFold<AstDataflowFact, 'reaches', boolean>(
      right,
      'reaches',
      () => false,
      rightReach => relationEqual(identityKey(leftReach.target), identityKey(rightReach.source)),
    ),
  );

export const createAstDataflowInterface = (
  node: AstNodeIdentity,
  source: SourceSpan,
  knowledge: SemanticKnowledgeDataFlow,
): AstDataflowInterface => {
  const facts = Object.freeze(uniqueFacts(relationProject(knowledge.dataFlow, canonicalFact)));
  const seed = Object.freeze(uniqueFacts([...facts, ...reachesFrom(facts)]));
  const fixed = relationFixedPoint(
    seed,
    current => Object.freeze(uniqueFacts([...current, ...transitiveReaches(current)])),
    (left, right) => relationEqual(JSON.stringify(relationProject(left, factKey)), JSON.stringify(relationProject(right, factKey))),
    128,
  );
  const closure = Object.freeze(fixed.value);
  const judgment: AstDataflowJudgment = Object.freeze({
    kind: 'ast_dataflow_judgment',
    node,
    source,
    facts,
    closure,
    derivations: Object.freeze([]),
    fixedPoint: 'least_fixed_point',
    reasoning: 'declarative_relation_rewrite_fixed_point',
    authority: 'ast_dataflow_judgment',
    closed: true,
  });
  return Object.freeze({ kind: 'ast_dataflow_interface', authority: 'ast_dataflow_judgment', judgment, closed: true });
};

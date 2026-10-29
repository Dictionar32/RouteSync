import type { SemanticDataflowFact, SemanticDataflowIdentity, SemanticDataflowInterface, SemanticDataflowJudgment, SemanticDataflowInputFact } from '../semanticDataflowInterface';
import type { SourceSpan } from '../provenance';

const source = {} as SourceSpan;
const identity = {} as SemanticDataflowIdentity;
const fact = {
  kind: 'reaches',
  source: identity,
  target: identity,
} satisfies SemanticDataflowFact;

const judgment = {
  kind: 'semantic_dataflow_judgment',
  node: identity,
  source,
  facts: [fact],
  closure: [fact],
  derivations: [{ kind: 'semantic_dataflow_derivation', rule: { kind: 'semantic_dataflow_rule', value: { kind: 'string_value', value: 'semantic-dataflow-canonical-fact' } }, witness: { kind: 'semantic_dataflow_witness', value: { kind: 'string_value', value: 'canonical-fixture' } }, premises: [], conclusion: fact }],
  paths: [],
  closureCertificate: {
    kind: 'semantic_dataflow_closure_certificate',
    factClosure: { kind: 'fact_closure', converged: true, rounds: 0 },
    pathClosure: { kind: 'path_closure', converged: true, rounds: 0 },
    derivationCoverage: { kind: 'derivation_coverage', complete: true, coveredFacts: 1 },
    closed: true,
  },
  origin: { kind: 'semantic_dataflow_origin', source: 'semantic_dataflow_input', identity, closed: true },
  reasoningContract: {
    kind: 'semantic_reasoning_contract', authority: 'upstream', strategy: 'declarative_relation_rewrite_fixed_point', closed: true,
    evidence: { kind: 'semantic_relation_fixed_point', closed: true },
    derivation: { kind: 'semantic_reasoning_derivation', strategy: 'declarative_relation_rewrite_fixed_point', closed: true },
    provenance: { kind: 'semantic_reasoning_provenance', authority: 'upstream', closed: true },
    closure: { kind: 'semantic_reasoning_closure', closed: true },
  },
  fixedPoint: 'least_fixed_point',
  operations: {
    containsFact: (_candidate: SemanticDataflowFact) => true,
    reaches: (_source: SemanticDataflowIdentity, _target: SemanticDataflowIdentity) => true,
    pathsBetween: (_source: SemanticDataflowIdentity, _target: SemanticDataflowIdentity) => [],
  },
  authority: 'semantic_dataflow_judgment',
  closed: true,
} satisfies SemanticDataflowJudgment;

const semanticInterface = {
  kind: 'semantic_dataflow_interface',
  authority: 'semantic_dataflow_judgment',
  reasoning: judgment.reasoningContract,
  origin: {
    kind: 'semantic_dataflow_origin',
    source: 'semantic_dataflow_input',
    identity,
    closed: true,
  },
  judgment,
  closed: true,
} satisfies SemanticDataflowInterface;

void semanticInterface;

const inputFactKinds: readonly SemanticDataflowInputFact['kind'][] = ['dependency', 'value_flow'];
void inputFactKinds;

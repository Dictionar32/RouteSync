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
  derivations: [],
  fixedPoint: 'least_fixed_point',
  reasoning: 'declarative_relation_rewrite_fixed_point',
  authority: 'semantic_dataflow_judgment',
  closed: true,
} satisfies SemanticDataflowJudgment;

const semanticInterface = {
  kind: 'semantic_dataflow_interface',
  authority: 'semantic_dataflow_judgment',
  origin: {
    kind: 'semantic_dataflow_origin',
    source: 'semantic_dataflow_input',
    identity: 'typed_semantic_dataflow_identity',
    closed: true,
  },
  judgment,
  closed: true,
} satisfies SemanticDataflowInterface;

void semanticInterface;

const inputFactKinds: readonly SemanticDataflowInputFact['kind'][] = ['dependency', 'value_flow'];
void inputFactKinds;

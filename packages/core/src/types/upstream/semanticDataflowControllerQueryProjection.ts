/**
 * Projects source-backed controller query inputs into canonical dataflow seeds.
 * Query semantics remain scanner evidence; closure remains upstream authority.
 */
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { ControllerQueryEvidence, ControllerQueryInput } from './controller';
import { semanticDataflowFactWithLineage, type SemanticDataflowInputFact, type SemanticDataflowIdentity } from './semanticDataflow';
import type { Expression } from './expression';
import { stringValue } from './valueObjects';

const controllerName = (controller: ControllerActionFlowContract): string => controller.controller.value.value;
const actionName = (controller: ControllerActionFlowContract): string => controller.action.value.value;

const sameSpan = (left: SemanticDataflowIdentity['source'], right: Expression['source']): boolean =>
  left.file.value.value === right.file.value.value
  && left.start.value === right.start.value
  && left.end.value === right.end.value;

const expressionIdentity = (
  controller: ControllerActionFlowContract,
  input: ControllerQueryInput,
): SemanticDataflowIdentity | undefined => {
  const expression = input.expression;
  const candidate = controller.semantic.dataflow.facts.find(fact => {
    const source = fact.source;
    return sameSpan(source.source, expression.source)
      && (expression.kind === 'variable'
        ? source.role === 'variable' && source.slot.value === `root:${expression.name.value.value}`
        : source.role === 'value' && source.slot.value === 'self');
  });
  return candidate?.source;
};

const queryIdentity = (
  controller: ControllerActionFlowContract,
  query: ControllerQueryEvidence,
): SemanticDataflowIdentity => Object.freeze({
  kind: 'semantic_dataflow_identity',
  source: query.source,
  role: 'invocation',
  slot: stringValue(`controller:${controllerName(controller)}.${actionName(controller)}:query:${query.source.start.value}:${query.source.end.value}`),
});

const inputFact = (
  controller: ControllerActionFlowContract,
  query: ControllerQueryEvidence,
  input: ControllerQueryInput,
): SemanticDataflowInputFact | undefined => {
  const source = expressionIdentity(controller, input);
  if (!source) return undefined;
  return semanticDataflowFactWithLineage(Object.freeze({
    kind: 'value_flow' as const,
    source,
    target: queryIdentity(controller, query),
    role: input.role === 'key' ? 'argument' as const : input.role === 'mutation' ? 'value' as const : 'predicate' as const,
  }), 'controller', source);
};

export const semanticDataflowControllerQueryFacts = (
  controller: ControllerActionFlowContract,
): readonly SemanticDataflowInputFact[] => {
  const facts: SemanticDataflowInputFact[] = [];
  let queries = controller.semantic.queries;
  while (queries.kind !== 'empty') {
    let inputs = queries.head.inputs;
    while (inputs.kind !== 'empty') {
      const fact = inputFact(controller, queries.head, inputs.head);
      if (fact) facts.push(fact);
      inputs = inputs.tail;
    }
    queries = queries.tail;
  }
  return Object.freeze(facts);
};

import type { ControllerSemanticVariableFlow, ControllerVariableBinding, ControllerVariableDefinition } from './controller';
import { variableNameEquals } from './names';
import type {
  ControllerSemanticVariableFlowCompositionAuthorityInterface,
  ControllerSemanticVariableFlowCompositionInput,
  ControllerSemanticVariableFlowCompositionJudgment,
} from './controllerSemanticVariableFlowCompositionInterface';

type ClosedSequence<T> =
  | Readonly<{ readonly kind: 'empty' }>
  | Readonly<{ readonly kind: 'cons'; readonly head: T; readonly tail: ClosedSequence<T> }>;

const appendDefinition = (
  definitions: ClosedSequence<ControllerVariableDefinition>,
  definition: ControllerVariableDefinition,
): ClosedSequence<ControllerVariableDefinition> => {
  switch (definitions.kind) {
    case 'empty':
      return Object.freeze({ kind: 'cons', head: definition, tail: Object.freeze({ kind: 'empty' }) });
    case 'cons':
      return Object.freeze({ kind: 'cons', head: definitions.head, tail: appendDefinition(definitions.tail, definition) });
  }
};

const groupDefinitions = (definitions: readonly ControllerVariableDefinition[]): readonly ControllerVariableBinding[] =>
  definitions.reduce<readonly ControllerVariableBinding[]>((groups, definition) => {
    const matchingIndex = groups.findIndex(binding => variableNameEquals(binding.variable, definition.variable));
    switch (matchingIndex) {
      case -1:
        return [...groups, Object.freeze({
          variable: definition.variable,
          definitions: Object.freeze({ kind: 'cons', head: definition, tail: Object.freeze({ kind: 'empty' }) }),
        })];
      default:
        return groups.map((binding, index) => {
          switch (Object.is(index, matchingIndex)) {
            case true: return Object.freeze({ ...binding, definitions: appendDefinition(binding.definitions, definition) });
            case false: return binding;
          }
        });
    }
  }, []);

const toSequence = <T>(values: readonly T[]): ClosedSequence<T> => values.reduceRight<ClosedSequence<T>>(
  (tail, head) => Object.freeze({ kind: 'cons', head, tail }),
  Object.freeze({ kind: 'empty' }),
);

const compose = (input: ControllerSemanticVariableFlowCompositionInput): ControllerSemanticVariableFlowCompositionJudgment => {
  const flow: ControllerSemanticVariableFlow = Object.freeze({ variables: toSequence(groupDefinitions(input.definitions)) });
  switch (input.definitions.length) {
    case 0:
      return Object.freeze({
        kind: 'controller_semantic_variable_flow_empty',
        flow,
        definitionEvidence: Object.freeze([]),
        closure: 'no-definitions-were-supplied',
        expressionOwnership: 'no-definition-is-published',
      });
    default:
      return Object.freeze({
        kind: 'controller_semantic_variable_flow_composed',
        flow,
        definitionEvidence: Object.freeze([...input.definitions]),
        closure: 'all-definitions-retained-and-grouped-by-canonical-variable-identity-in-source-order',
        expressionOwnership: 'each-definition-has-one-canonical-expression-owned-by-its-semanticResolution-judgment',
      });
  }
};

export const controllerSemanticVariableFlowCompositionAuthority: ControllerSemanticVariableFlowCompositionAuthorityInterface = Object.freeze({
  kind: 'controller_semantic_variable_flow_composition_authority',
  contractVersion: 3,
  expressionOwnership: 'definition-does-not-duplicate-expression-outside-the-closed-semanticResolution-judgment',
  compose,
});

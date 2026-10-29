import type { PhpAstValue, PhpClassReferenceSourceEvidence, SourceRange } from '../phpAstTypes';
import type { PhpArgument } from '../phpAstExpressionTypes';
import type {
  ControllerSemanticVariableFlow,
  ControllerVariableBinding,
  ControllerVariableDefinition,
  ControllerResponseReferenceJudgment,
} from '../../../../types/upstream/controller';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type {
  ControllerResourceBindingCandidate,
  ControllerResourceModelOriginEvidence,
} from '../../../../types/upstream/controllerResourceBindingInterface';
import type {
  ControllerResourceReturnSourceEvidence,
  ControllerResourceReturnSourceEvidenceProjectionInput,
  ControllerResourceReturnSourceEvidenceProjectionInterface,
} from '../../../../types/upstream/controllerResourceReturnSourceEvidenceProjectionInterface';
import type {
  ControllerStaticCallClassNameResolutionContextEvidence,
  ControllerStaticCallModelClassIdentity,
  ControllerStaticCallOriginInput,
  ControllerStaticCallTableArgumentEvidence,
} from '../../../../types/upstream/controllerStaticCallOriginInterface';
import { createClassName, createMethodName } from '../../../../types/upstream/names';
import { stringValue } from '../../../../types/upstream/valueObjects';

type ClosedSequence<T> =
  | Readonly<{ readonly kind: 'empty' }>
  | Readonly<{ readonly kind: 'cons'; readonly head: T; readonly tail: ClosedSequence<T> }>;

const latestDefinition = (definitions: ClosedSequence<ControllerVariableDefinition>): ControllerVariableDefinition | undefined => {
  switch (definitions.kind) {
    case 'empty': return undefined;
    case 'cons': {
      const tail = latestDefinition(definitions.tail);
      switch (tail) {
        case undefined: return definitions.head;
        default: return tail;
      }
    }
  }
};

const latestBinding = (
  variables: ClosedSequence<ControllerVariableBinding>,
  name: string,
): ControllerVariableBinding | undefined => {
  switch (variables.kind) {
    case 'empty': return undefined;
    case 'cons':
      switch (Object.is(variables.head.variable.value.value, name)) {
        case true: return variables.head;
        case false: return latestBinding(variables.tail, name);
      }
  }
};

const semanticVariableJudgment = (
  flow: ControllerSemanticVariableFlow,
  name: string,
): ControllerResourceModelOriginEvidence => {
  const binding = latestBinding(flow.variables, name);
  switch (binding) {
    case undefined: return Object.freeze({ kind: 'variable_semantic_missing' });
    default: {
      const definition = latestDefinition(binding.definitions);
      switch (definition) {
        case undefined: return Object.freeze({ kind: 'variable_semantic_missing' });
        default: return Object.freeze({ kind: 'variable_semantic_judgment', judgment: definition.semanticResolution });
      }
    }
  }
};

const classReferenceEvidence = (
  evidence: PhpClassReferenceSourceEvidence,
): ControllerStaticCallOriginInput['classReference'] => {
  switch (evidence.kind) {
    case 'simple_name':
      return Object.freeze({ kind: 'simple_name', name: createClassName(evidence.sourceName) });
    case 'qualified_name':
      return Object.freeze({ kind: 'qualified_name', sourceName: createClassName(evidence.sourceName), form: evidence.form });
  }
};

const staticCallTableArgumentEvidence = (
  argumentsList: readonly PhpArgument[],
): ControllerStaticCallTableArgumentEvidence => {
  const argument = argumentsList[0];
  switch (argument) {
    case undefined: return Object.freeze({ kind: 'absent' });
    default:
      switch (argument.kind) {
        case 'positional': return staticCallPositionalValueEvidence(argument.value);
        case 'named':
        case 'unpacked': return Object.freeze({ kind: 'unsupported_argument_shape' });
      }
  }
};

const staticCallPositionalValueEvidence = (value: PhpAstValue): ControllerStaticCallTableArgumentEvidence => {
  switch (value.kind) {
    case 'literal':
      switch (value.literalType) {
        case 'string': return Object.freeze({ kind: 'positional_string_literal', value: stringValue.create(value.value) });
        case 'number':
        case 'boolean':
        case 'null': return Object.freeze({ kind: 'unsupported_argument_shape' });
      }
    default: return Object.freeze({ kind: 'unsupported_argument_shape' });
  }
};

const staticCallOriginInput = (
  value: Extract<PhpAstValue, { readonly kind: 'static_call' }>,
  modelClasses: readonly ControllerStaticCallModelClassIdentity[],
  classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence,
): ControllerStaticCallOriginInput => Object.freeze({
  kind: 'controller_static_call_origin_input',
  classReference: classReferenceEvidence(value.classReference),
  classNameResolutionContext: classNameResolutionContextEvidence,
  methodName: createMethodName(value.method),
  tableArgument: staticCallTableArgumentEvidence(value.arguments),
  modelClasses,
});

const modelOriginEvidence = (
  value: PhpAstValue,
  flow: ControllerSemanticVariableFlow,
  modelClasses: readonly ControllerStaticCallModelClassIdentity[],
  classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence,
): ControllerResourceModelOriginEvidence => {
  switch (value.kind) {
    case 'variable_reference': return semanticVariableJudgment(flow, value.name);
    case 'static_call': return Object.freeze({
      kind: 'static_call_origin_input',
      input: staticCallOriginInput(value, modelClasses, classNameResolutionContextEvidence),
    });
    case 'method_chain': return Object.freeze({
      kind: 'method_chain_receiver',
      receiver: modelOriginEvidence(value.receiver, flow, modelClasses, classNameResolutionContextEvidence),
    });
    default: return Object.freeze({ kind: 'unsupported_expression' });
  }
};

const staticCollectionModelOriginEvidence = (
  argumentsList: readonly PhpArgument[],
  flow: ControllerSemanticVariableFlow,
  modelClasses: readonly ControllerStaticCallModelClassIdentity[],
  classNameResolutionContextEvidence: ControllerStaticCallClassNameResolutionContextEvidence,
): Extract<ControllerResourceBindingCandidate, { readonly kind: 'static_call' }>['argument'] => {
  const argument = argumentsList[0];
  switch (argument) {
    case undefined: return Object.freeze({ kind: 'absent' });
    default:
      switch (argument.kind) {
        case 'positional': return Object.freeze({
          kind: 'positional',
          modelOrigin: modelOriginEvidence(argument.value, flow, modelClasses, classNameResolutionContextEvidence),
        });
        case 'named':
        case 'unpacked': return Object.freeze({ kind: 'unsupported_argument_shape' });
      }
  }
};

const resourceBindingCandidate = (
  value: PhpAstValue,
  input: ControllerResourceReturnSourceEvidenceProjectionInput<PhpAstValue, SourceRange>,
): ControllerResourceBindingCandidate => {
  switch (value.kind) {
    case 'resource_single':
    case 'resource_collection':
      return Object.freeze({
        kind: 'direct_resource',
        resourceName: SemanticValueFactory.resourceName(value.resourceName),
        modelOrigin: modelOriginEvidence(value.argument, input.semanticVariables, input.modelClasses, input.classNameResolutionContextEvidence),
        response: input.response,
      });
    case 'static_call':
      return Object.freeze({
        kind: 'static_call',
        resourceName: SemanticValueFactory.resourceName(value.classReference.terminalName),
        methodName: createMethodName(value.method),
        argument: staticCollectionModelOriginEvidence(value.arguments, input.semanticVariables, input.modelClasses, input.classNameResolutionContextEvidence),
        response: input.response,
      });
    default: return Object.freeze({ kind: 'other_expression' });
  }
};

const nestedExpressions = (value: PhpAstValue): readonly PhpAstValue[] => {
  switch (value.kind) {
    case 'method_chain': return Object.freeze([
      ...value.arguments.map(argument => argument.value),
      value.receiver,
    ]);
    case 'function_call': return Object.freeze(value.arguments.map(argument => argument.value));
    case 'nested_array': return Object.freeze(value.entries.map(entry => entry.value));
    case 'ternary_expression': return Object.freeze([value.trueBranch, value.falseBranch]);
    case 'null_coalesce': return Object.freeze([value.left, value.right]);
    default: return Object.freeze([]);
  }
};

const projectExpression = (
  value: PhpAstValue,
  input: ControllerResourceReturnSourceEvidenceProjectionInput<PhpAstValue, SourceRange>,
): readonly ControllerResourceReturnSourceEvidence<SourceRange>[] => Object.freeze([
  Object.freeze({
    kind: 'controller_resource_return_source_evidence',
    source: value.source,
    candidate: resourceBindingCandidate(value, input),
  }),
  ...nestedExpressions(value).flatMap(expression => projectExpression(expression, input)),
]);

export const controllerResourceReturnSourceEvidenceProjection: ControllerResourceReturnSourceEvidenceProjectionInterface<PhpAstValue, SourceRange> = Object.freeze({
  kind: 'controller_resource_return_source_evidence_projection',
  contractVersion: 1,
  semanticOwnership: 'source-shape-only;ControllerResourceBindingAuthorityInterface-owns-applicability-and-closed-resource-judgment',
  provenanceOwnership: 'each-candidate-retains-the-source-location-of-the-exact-return-expression-that-produced-it',
  project: (input: ControllerResourceReturnSourceEvidenceProjectionInput<PhpAstValue, SourceRange>) => Object.freeze(input.returnedExpressions.flatMap(returned => projectExpression(returned.expression, input))),
});

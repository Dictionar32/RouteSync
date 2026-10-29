import { variableNameEquals } from './names';
import type {
  ControllerVariableSemanticAuthorityInterface,
  ControllerVariableSemanticReasoningContract,
  ControllerVariableResolvedSemanticJudgment,
  ControllerVariableSemanticEvidence,
  ControllerVariableSemanticJudgment,
  ControllerVariableSemanticResolutionRequest,
  ControllerVariableSemanticRuleId,
} from './controllerVariableSemanticInterface';
import type { ControllerVariableSemantic } from './controller';
import { stringValue } from './valueObjects';
import type { SemanticValue } from './primitiveVocabulary';

const externalSemantic: ControllerVariableSemantic = Object.freeze({ kind: 'external' });
const unresolvedExternal: Readonly<{ readonly kind: 'unresolved'; readonly reason: 'external' }> = Object.freeze({ kind: 'unresolved', reason: 'external' });
const unresolvedUnsupported: Readonly<{ readonly kind: 'unresolved'; readonly reason: 'unsupported' }> = Object.freeze({ kind: 'unresolved', reason: 'unsupported' });
const unresolvedAmbiguous: Readonly<{ readonly kind: 'unresolved'; readonly reason: 'ambiguous' }> = Object.freeze({ kind: 'unresolved', reason: 'ambiguous' });

const reasoningPrecedence: ControllerVariableSemanticReasoningContract['precedence'] = [
  'parameter-binding',
  'database-table-call',
  'external-fallback',
];

const reasoningRules: ControllerVariableSemanticReasoningContract['rules'] = [
  {
    kind: 'parameter_binding_rule',
    rule: 'parameter-binding',
    premise: 'variable-reference',
    matching: 'canonical-variable-name-identity',
    cardinality: 'zero-continues;one-resolves;many-ambiguous',
  },
  {
    kind: 'database_table_call_rule',
    rule: 'database-table-call',
    premise: 'static-call-DB-table-with-non-empty-positional-string-literal',
    conclusion: 'model-origin-table',
  },
  {
    kind: 'external_fallback_rule',
    rule: 'external-fallback',
    premise: 'no-higher-precedence-rule-resolves',
    conclusion: 'external-semantic',
  },
];

/** Canonical, data-only semantic policy. No executable rule callbacks are hidden in this contract. */
export const CONTROLLER_VARIABLE_SEMANTIC_REASONING_CONTRACT: ControllerVariableSemanticReasoningContract = Object.freeze({
  kind: 'controller_variable_semantic_reasoning_contract',
  revision: 2,
  authority: 'upstream',
  closed: true,
  precedence: Object.freeze(reasoningPrecedence),
  rules: Object.freeze(reasoningRules),
  parameterBindingAmbiguity: 'multiple-matching-bindings-produce-ambiguous-judgment;never-select-first',
  expressionOwnership: 'all-judgments-retain-the-exact-sourceExpression-from-the-request',
});

const resolvedJudgment = (
  rule: ControllerVariableSemanticRuleId,
  semantic: ControllerVariableSemantic,
  evidence: ControllerVariableSemanticEvidence,
  sourceExpression: ControllerVariableSemanticResolutionRequest['sourceExpression'],
): ControllerVariableResolvedSemanticJudgment => {
  switch (semantic.kind) {
    case 'model_origin':
      return {
        kind: 'resolved', rule, semantic,
        expressionValue: {
          kind: 'reference',
          name: { kind: 'domain_type_name', value: semantic.origin.name.value },
          cardinality: { kind: 'one' },
          nullability: { kind: 'non_nullable' },
        },
        sourceExpression, evidence, closed: true,
      };
    case 'request_origin':
      return {
        kind: 'resolved', rule, semantic,
        expressionValue: {
          kind: 'reference',
          name: { kind: 'domain_type_name', value: semantic.name.value },
          cardinality: { kind: 'one' },
          nullability: { kind: 'non_nullable' },
        },
        sourceExpression, evidence, closed: true,
      };
    case 'expression':
      return { kind: 'resolved', rule, semantic, expressionValue: unresolvedUnsupported, sourceExpression, evidence, closed: true };
    case 'external':
      return { kind: 'resolved', rule, semantic, expressionValue: unresolvedExternal, sourceExpression, evidence, closed: true };
  }
};

type ParameterBindingOutcome =
  | Readonly<{ readonly kind: 'not_applicable' }>
  | Readonly<{ readonly kind: 'unmatched' }>
  | Readonly<{ readonly kind: 'matched'; readonly binding: ControllerVariableSemanticResolutionRequest['parameterBindings'][number] }>
  | Readonly<{
      readonly kind: 'ambiguous';
      readonly evidence: Extract<ControllerVariableSemanticEvidence, { readonly kind: 'variable_reference' }>;
      readonly candidates: readonly ControllerVariableSemanticResolutionRequest['parameterBindings'][number][];
    }>;

const parameterBindingOutcome = (request: ControllerVariableSemanticResolutionRequest): ParameterBindingOutcome => {
  const evidence = request.evidence;
  switch (evidence.kind) {
    case 'variable_reference': {
      const candidates = request.parameterBindings.filter(binding => variableNameEquals(binding.variable, evidence.variable));
      switch (candidates.length) {
        case 0:
          return { kind: 'unmatched' };
        case 1: {
          const binding = candidates[0];
          switch (binding) {
            case undefined:
              return { kind: 'unmatched' };
            default:
              return { kind: 'matched', binding };
          }
        }
        default:
          return { kind: 'ambiguous', evidence, candidates: Object.freeze([...candidates]) };
      }
    }
    case 'static_call':
    case 'other_expression':
      return { kind: 'not_applicable' };
  }
};

const databaseTableName = (evidence: ControllerVariableSemanticEvidence): string | undefined => {
  switch (evidence.kind) {
    case 'static_call': {
      switch (evidence.className) {
        case 'DB':
          switch (evidence.methodName) {
            case 'table': {
              const firstPositionalString = evidence.arguments.find(argument => Object.is(argument.kind, 'positional_string_literal'));
              switch (firstPositionalString?.kind) {
                case 'positional_string_literal':
                  switch (firstPositionalString.value.length) {
                    case 0:
                      return undefined;
                    default:
                      return firstPositionalString.value;
                  }
                case 'positional_non_string':
                case 'named_argument':
                case 'unpacked_argument':
                case undefined:
                  return undefined;
              }
            }
            default:
              return undefined;
          }
        default:
          return undefined;
      }
    }
    case 'variable_reference':
    case 'other_expression':
      return undefined;
  }
};

const resolve = (request: ControllerVariableSemanticResolutionRequest): ControllerVariableSemanticJudgment => {
  const parameter = parameterBindingOutcome(request);
  switch (parameter.kind) {
    case 'ambiguous':
      return {
        kind: 'ambiguous',
        reason: 'parameter_binding',
        sourceExpression: request.sourceExpression,
        evidence: parameter.evidence,
        candidates: parameter.candidates,
        expressionValue: unresolvedAmbiguous,
        closed: true,
      };
    case 'matched':
      return resolvedJudgment('parameter-binding', parameter.binding.semantic, request.evidence, request.sourceExpression);
    case 'unmatched':
    case 'not_applicable': {
      const table = databaseTableName(request.evidence);
      switch (table) {
        case undefined:
          return resolvedJudgment('external-fallback', externalSemantic, request.evidence, request.sourceExpression);
        default:
          return resolvedJudgment('database-table-call', {
            kind: 'model_origin',
            origin: { kind: 'table', name: { kind: 'table_name', value: stringValue.create(table) } },
          }, request.evidence, request.sourceExpression);
      }
    }
  }
};

export const controllerVariableSemanticAuthority: ControllerVariableSemanticAuthorityInterface = Object.freeze({
  kind: 'controller_variable_semantic_authority',
  contractVersion: 2,
  authority: 'upstream',
  reasoning: CONTROLLER_VARIABLE_SEMANTIC_REASONING_CONTRACT,
  judgmentContract: 'semantic_and_expression_value_are_integrated',
  sourceExpressionContract: 'every-closed-judgment-retains-the-exact-canonical-sourceExpression-reference-from-its-request',
  resolve,
});

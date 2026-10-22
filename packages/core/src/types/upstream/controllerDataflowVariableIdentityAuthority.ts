import type { KnowledgeId, SemanticFact } from './semanticDataflowKnowledge';
import type { VariableName } from './names';
import type {
  ControllerDataflowVariableIdentityAuthorityInterface,
  ControllerDataflowVariableIdentityInput,
  ControllerDataflowVariableIdentityJudgment,
} from './controllerDataflowVariableIdentityInterface';

const sameIdentity = (left: KnowledgeId, right: KnowledgeId): boolean =>
  Object.is(left.identity.role, right.identity.role)
  && Object.is(left.identity.slot.value, right.identity.slot.value)
  && Object.is(left.identity.source.filePath.value, right.identity.source.filePath.value)
  && Object.is(left.identity.source.span.start.value, right.identity.source.span.start.value)
  && Object.is(left.identity.source.span.end.value, right.identity.source.span.end.value)
  && Object.is(left.identity.source.evidence.code, right.identity.source.evidence.code);

const variableFacts = (
  facts: readonly SemanticFact[],
  identity: KnowledgeId,
): readonly Extract<SemanticFact, { readonly kind: 'variable' }>['value'][] => facts.flatMap((fact): readonly Extract<SemanticFact, { readonly kind: 'variable' }>['value'][] => {
  switch (fact.kind) {
    case 'variable':
      switch (sameIdentity(fact.value.id, identity)) {
        case true: return [fact.value];
        case false: return [];
      }
    default: return [];
  }
});

const toVariableName = (value: Extract<SemanticFact, { readonly kind: 'variable' }>['value']['name']): VariableName => Object.freeze({
  kind: 'variable_name',
  value: Object.freeze({ kind: 'string_value', value: value.value.value }),
});

const resolve = (input: ControllerDataflowVariableIdentityInput): ControllerDataflowVariableIdentityJudgment => {
  const candidates = variableFacts(input.facts, input.identity);
  switch (candidates.length) {
    case 0: return Object.freeze({ kind: 'controller_dataflow_variable_identity_missing', identity: input.identity });
    case 1: {
      const candidate = candidates[0];
      switch (candidate) {
        case undefined: return Object.freeze({ kind: 'controller_dataflow_variable_identity_missing', identity: input.identity });
        default: return Object.freeze({
          kind: 'controller_dataflow_variable_identity_resolved',
          identity: input.identity,
          variable: toVariableName(candidate.name),
          evidence: candidate,
        });
      }
    }
    default: return Object.freeze({ kind: 'controller_dataflow_variable_identity_ambiguous', identity: input.identity, candidates });
  }
};

export const controllerDataflowVariableIdentityAuthority: ControllerDataflowVariableIdentityAuthorityInterface = Object.freeze({
  kind: 'controller_dataflow_variable_identity_authority',
  contractVersion: 1,
  resolve,
});

import { controllerStaticCallOriginAuthority } from './controllerStaticCallOriginAuthority';
import { createMethodName, methodNameEquals } from './names';
import type {
  ControllerResourceBindingAuthorityInterface,
  ControllerResourceBindingCandidate,
  ControllerResourceBindingJudgment,
  ControllerResourceModelOriginEvidence,
  ControllerResourceModelOriginJudgment,
  ControllerResourceStaticCallRuleInterface,
  ControllerResourceBindingPublicationInput,
} from './controllerResourceBindingInterface';

const judgeModelOrigin = (evidence: ControllerResourceModelOriginEvidence): ControllerResourceModelOriginJudgment => {
  switch (evidence.kind) {
    case 'variable_semantic_judgment':
      switch (evidence.judgment.kind) {
        case 'resolved':
          switch (evidence.judgment.semantic.kind) {
            case 'model_origin':
              return { kind: 'resolved', origin: evidence.judgment.semantic.origin, closed: true };
            case 'request_origin':
            case 'expression':
            case 'external':
              return { kind: 'unresolved', closed: true };
          }
        case 'not_resolved':
        case 'ambiguous':
        case 'contract_violation':
          return { kind: 'unresolved', closed: true };
      }
    case 'variable_semantic_missing':
      return { kind: 'missing', closed: true };
    case 'unsupported_expression':
      return { kind: 'unresolved', closed: true };
    case 'static_call_origin_input': {
      const judgment = controllerStaticCallOriginAuthority.judge(evidence.input);
      switch (judgment.kind) {
        case 'resolved':
          return { kind: 'resolved', origin: judgment.origin, closed: true };
        case 'unresolved':
        case 'not_applicable':
          return { kind: 'unresolved', closed: true };
      }
    }
    case 'method_chain_receiver':
      return judgeModelOrigin(evidence.receiver);
  }
};

const unresolvedModelReason = (judgment: Extract<ControllerResourceModelOriginJudgment, { readonly kind: 'missing' | 'unresolved' }>): 'model_origin_missing' | 'model_origin_unresolved' => {
  switch (judgment.kind) {
    case 'missing':
      return 'model_origin_missing';
    case 'unresolved':
      return 'model_origin_unresolved';
  }
};

const judgeDirectResource = (candidate: Extract<ControllerResourceBindingCandidate, { readonly kind: 'direct_resource' }>): ControllerResourceBindingJudgment => {
  switch (candidate.response.kind) {
    case 'response_reference_not_declared':
      return { kind: 'unresolved', reason: 'response_reference_not_declared', closed: true };
    case 'response_reference_declared': {
      const modelJudgment = judgeModelOrigin(candidate.modelOrigin);
      switch (modelJudgment.kind) {
        case 'missing':
        case 'unresolved':
          return { kind: 'unresolved', reason: unresolvedModelReason(modelJudgment), closed: true };
        case 'resolved':
          return {
            kind: 'resolved',
            rule: 'direct_resource_model_origin',
            resourceName: candidate.resourceName,
            model: modelJudgment.origin,
            response: candidate.response.response,
            closed: true,
          };
      }
    }
  }
};

const judgeResourceCollection = (candidate: Extract<ControllerResourceBindingCandidate, { readonly kind: 'static_call' }>): ControllerResourceBindingJudgment => {
  switch (candidate.response.kind) {
    case 'response_reference_not_declared':
      return { kind: 'unresolved', reason: 'response_reference_not_declared', closed: true };
    case 'response_reference_declared':
      switch (candidate.argument.kind) {
        case 'absent':
          return { kind: 'unresolved', reason: 'collection_argument_absent', closed: true };
        case 'unsupported_argument_shape':
          return { kind: 'unresolved', reason: 'collection_argument_unsupported', closed: true };
        case 'positional': {
          const modelJudgment = judgeModelOrigin(candidate.argument.modelOrigin);
          switch (modelJudgment.kind) {
            case 'missing':
            case 'unresolved':
              return { kind: 'unresolved', reason: unresolvedModelReason(modelJudgment), closed: true };
            case 'resolved':
              return {
                kind: 'resolved',
                rule: 'resource_collection_model_origin',
                resourceName: candidate.resourceName,
                model: modelJudgment.origin,
                response: candidate.response.response,
                closed: true,
              };
          }
        }
      }
  }
};

const resourceCollectionStaticCallRule: ControllerResourceStaticCallRuleInterface = Object.freeze({
  kind: 'controller_resource_static_call_rule',
  methodName: createMethodName('collection'),
  judge: judgeResourceCollection,
});

const controllerResourceStaticCallRules: readonly ControllerResourceStaticCallRuleInterface[] = Object.freeze([
  resourceCollectionStaticCallRule,
]);

const judgeStaticCallCandidate = (
  candidate: Extract<ControllerResourceBindingCandidate, { readonly kind: 'static_call' }>,
): ControllerResourceBindingJudgment => {
  const matchingRule = controllerResourceStaticCallRules.find(rule =>
    methodNameEquals(rule.methodName, candidate.methodName),
  );
  switch (matchingRule) {
    case undefined:
      return { kind: 'not_applicable', closed: true };
    default:
      return matchingRule.judge(candidate);
  }
};

export const controllerResourceBindingAuthority: ControllerResourceBindingAuthorityInterface = Object.freeze({
  kind: 'controller_resource_binding_authority',
  contractVersion: 8,
  judgmentContract: 'closed_model_origin_judgment_and_canonical_controller_response_are_correlated_and_static_call_applicability_is_judged_upstream',
  responseContractRule: 'reuse_declared_response_reference_judgment_without_claiming_http_return_presence',
  staticCallRules: controllerResourceStaticCallRules,
  staticCallRule: 'static_call_applicability_is_resolved_by_typed_rule_registration_not_method_name_switch',
  judgeModelOrigin,
  publishResolved: (input: ControllerResourceBindingPublicationInput) => Object.freeze({
    resource: Object.freeze({ kind: 'resource_reference' as const, name: input.resourceName }),
    model: input.model,
    response: input.response,
    source: input.source,
  }),
  judge: (candidate: ControllerResourceBindingCandidate): ControllerResourceBindingJudgment => {
    switch (candidate.kind) {
      case 'direct_resource':
        return judgeDirectResource(candidate);
      case 'static_call':
        return judgeStaticCallCandidate(candidate);
      case 'other_expression':
        return { kind: 'not_applicable', closed: true };
    }
  },
});

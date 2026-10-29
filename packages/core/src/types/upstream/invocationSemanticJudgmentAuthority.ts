/** Authority validates the staged algebra judgment before any downstream consumer sees it. */
import { semanticKnowledgeIdOperations, semanticSource, type KnowledgeId, type SemanticKnowledgeDataFlow, type SemanticInvocation, type SemanticSource } from './semanticDataflowKnowledge';
import type {
  InvocationArgumentBindingJudgment,
  InvocationSemanticAnalysis,
  InvocationSemanticAuthorityInterface,
  SemanticInterproceduralDataFlowAuthorityInterface,
  InvocationSemanticDerivationWitness,
  InvocationSemanticInput,
  InvocationSemanticJudgment,
  InvocationSemanticContractOperationsInterface,
  SemanticArgumentParameterFlow,
  SemanticInvocationObligation,
} from './invocationSemanticJudgmentInterface';
import { INVOCATION_SEMANTIC_CONTRACT, invocationSemanticWitnessOwnership } from './invocationSemanticJudgmentInterface';
import { invocationSemanticKnowledgeAlgebraOperations } from './invocationSemanticJudgmentAlgebra';

const sameKnowledgeId = (left: KnowledgeId, right: KnowledgeId): boolean =>
  semanticKnowledgeIdOperations.same(left, right).kind === 'same_knowledge_id';

export type InvocationSemanticShapeEquality =
  | Readonly<{ readonly kind: 'same_invocation_semantic_shape' }>
  | Readonly<{ readonly kind: 'different_invocation_semantic_shape' }>;

/** Domain-owned equality operations for source provenance and invocation identity. */
export interface InvocationSemanticIdentityOperationsInterface {
  readonly sameSource: (left: SemanticSource, right: SemanticSource) => ReturnType<typeof semanticSource.same>;
  readonly sameShape: (left: SemanticInvocation, right: SemanticInvocation) => InvocationSemanticShapeEquality;
}

export const invocationSemanticIdentityOperations: InvocationSemanticIdentityOperationsInterface = Object.freeze({
  sameSource: semanticSource.same,
  sameShape: (left: SemanticInvocation, right: SemanticInvocation): InvocationSemanticShapeEquality => {
    if (!sameKnowledgeId(left.id, right.id)) return Object.freeze({ kind: 'different_invocation_semantic_shape' as const });
    switch (left.receiver.kind) {
      case 'present':
        if (right.receiver.kind !== 'present' || !sameKnowledgeId(left.receiver.value, right.receiver.value)) {
          return Object.freeze({ kind: 'different_invocation_semantic_shape' as const });
        }
        break;
      case 'absent':
        if (right.receiver.kind !== 'absent' || left.receiver.reason.code !== right.receiver.reason.code) {
          return Object.freeze({ kind: 'different_invocation_semantic_shape' as const });
        }
        break;
    }
    if (left.operation.name.value !== right.operation.name.value) return Object.freeze({ kind: 'different_invocation_semantic_shape' as const });
    if (left.arguments.length !== right.arguments.length) return Object.freeze({ kind: 'different_invocation_semantic_shape' as const });
    const sameOrderedArguments = left.arguments.every((argument, index) => {
      const candidate = right.arguments[index];
      return candidate !== undefined && sameKnowledgeId(argument, candidate);
    });
    if (!sameOrderedArguments) return Object.freeze({ kind: 'different_invocation_semantic_shape' as const });
    if (semanticSource.same(left.source, right.source).kind !== 'same_semantic_source') {
      return Object.freeze({ kind: 'different_invocation_semantic_shape' as const });
    }
    return Object.freeze({ kind: 'same_invocation_semantic_shape' as const });
  },
});

const sameSource = (left: SemanticSource, right: SemanticSource): boolean =>
  invocationSemanticIdentityOperations.sameSource(left, right).kind === 'same_semantic_source';

const sameInvocationShape = (left: SemanticInvocation, right: SemanticInvocation): boolean =>
  invocationSemanticIdentityOperations.sameShape(left, right).kind === 'same_invocation_semantic_shape';

const witnessInvocationId = (witness: InvocationSemanticDerivationWitness): KnowledgeId =>
  witness.kind === 'argument-binding' ? witness.judgment.invocation.id : witness.invocation;

const isBlockedBinding = (binding: InvocationArgumentBindingJudgment): binding is Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> => binding.kind === 'blocked';

const sameObligationIdentity = (left: SemanticInvocationObligation, right: SemanticInvocationObligation): boolean => {
  if (left.kind !== right.kind || !sameKnowledgeId(left.invocation.id, right.invocation.id)) return false;
  switch (left.kind) {
    case 'callable_target_unresolved':
    case 'invocation_evidence_missing':
    case 'argument_form_unproven':
      return true;
    case 'argument_parameter_unresolved':
      return right.kind === 'argument_parameter_unresolved' && sameKnowledgeId(left.argument, right.argument);
    case 'callable_target_ambiguous':
      return right.kind === 'callable_target_ambiguous'
        && left.candidateCallables.length === right.candidateCallables.length
        && left.candidateCallables.every((candidate, index) => {
          const corresponding = right.candidateCallables[index];
          return corresponding !== undefined && sameKnowledgeId(candidate.id, corresponding.id);
        });
    default: {
      const exhaustive: never = left;
      return exhaustive;
    }
  }
};

/**
 * Reject malformed evidence at the authority boundary before the algebra can
 * reinterpret it as an unresolved semantic outcome. This validates the input
 * contract; it does not derive invocation meaning.
 */
const validateInvocationSemanticInput = (input: InvocationSemanticInput): InvocationSemanticInput => {
  const requestedIdentity = input.invocation.id;
  const fail = (invariant: string): never => {
    throw new Error(`Invocation semantic input contract violation: ${invariant}`);
  };
  const sameIdentityFacts = input.knowledge.facts.filter(
    (fact): fact is Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'invocation' }> =>
      fact.kind === 'invocation' && sameKnowledgeId(fact.value.id, requestedIdentity),
  );
  sameIdentityFacts.forEach(fact => {
    if (!sameInvocationShape(fact.value, input.invocation)) {
      fail('requested invocation reuses a knowledge identity with different receiver, operation, ordered arguments, or source provenance');
    }
  });
  switch (input.positionalEvidence.kind) {
    case 'positional-evidence-established': {
      const evidence = input.positionalEvidence.evidence;
      if (!sameKnowledgeId(evidence.invocation, requestedIdentity)) fail('positional evidence belongs to another invocation');
      if (evidence.normalizedArguments.length !== input.invocation.arguments.length ||
        evidence.normalizedArguments.some((argument, index) => {
          const requestedArgument = input.invocation.arguments[index];
          return requestedArgument === undefined || !sameKnowledgeId(argument, requestedArgument);
        })) fail('positional evidence does not cover the exact ordered invocation arguments');
      return input;
    }
    case 'positional-evidence-unproven':
      if (!sameInvocationShape(input.positionalEvidence.obligation.invocation, input.invocation)) {
        fail('positional-evidence obligation does not preserve the exact requested invocation');
      }
      return input;
    default: {
      const exhaustive: never = input.positionalEvidence;
      return exhaustive;
    }
  }
};

const assertArgumentCoverage = (
  invocation: InvocationSemanticJudgment['invocation'],
  binding: InvocationArgumentBindingJudgment,
  fail: (invariant: string) => never,
): void => {
  const dispositions = binding.argumentDispositions;
  if (dispositions.length !== invocation.arguments.length) fail('argument disposition ledger does not cover every invocation argument');
  dispositions.forEach((disposition, index) => {
    const expected = invocation.arguments[index];
    const actual = disposition.kind === 'bound-argument' ? disposition.relation.argument : disposition.argument;
    if (expected === undefined || !sameKnowledgeId(expected, actual)) fail('argument disposition order or identity differs from invocation.arguments');
  });
  if (binding.kind === 'not-required' && invocation.arguments.length !== 0) fail('not-required binding has invocation arguments');
  if (binding.kind === 'established' && dispositions.some(disposition => disposition.kind !== 'bound-argument')) {
    fail('established binding contains a non-bound disposition');
  }
  if (binding.kind === 'incomplete' && !dispositions.some(disposition => disposition.kind === 'unbound-argument')) {
    fail('incomplete binding has no unbound argument');
  }
  if (binding.kind === 'argument-form-unproven' && dispositions.some(disposition => disposition.kind !== 'argument-form-unproven')) {
    fail('argument-form-unproven contains a disposition from another outcome');
  }
  if (binding.kind === 'blocked' && dispositions.some(disposition => disposition.kind !== 'binding-unavailable-argument')) {
    fail('blocked binding contains a disposition from another outcome');
  }
};

/** Structural and cross-field identity validation; it never derives or repairs semantics. */
const validateInvocationSemanticJudgment = (
  input: InvocationSemanticInput,
  judgment: InvocationSemanticJudgment,
): InvocationSemanticJudgment => {
  const requestedIdentity = input.invocation.id;
  const fail = (invariant: string): never => {
    throw new Error(`Invocation semantic contract violation: ${invariant}`);
  };
  if (judgment.kind !== 'invocation_semantic_judgment') fail('unexpected judgment kind');
  if (!sameKnowledgeId(requestedIdentity, judgment.invocation.id)) fail('result invocation identity differs from request');
  if (!sameKnowledgeId(requestedIdentity, judgment.targetResolution.invocation.id)) fail('target-resolution invocation identity differs from request');
  if (!sameKnowledgeId(requestedIdentity, judgment.argumentBinding.invocation.id)) fail('argument-binding invocation identity differs from request');
  const invocationIsPresent = input.knowledge.facts.some(fact =>
    fact.kind === 'invocation' && sameInvocationShape(fact.value, input.invocation),
  );
  const hasMissingInvocationObligation = judgment.unresolvedObligations.some(obligation => obligation.kind === 'invocation_evidence_missing');
  if (!invocationIsPresent && !hasMissingInvocationObligation) fail('absent invocation lacks its missing-evidence obligation');
  if (invocationIsPresent && hasMissingInvocationObligation) fail('present invocation incorrectly carries missing-evidence obligation');
  assertArgumentCoverage(judgment.invocation, judgment.argumentBinding, fail);

  const targetResolution = judgment.targetResolution;
  const binding = judgment.argumentBinding;
  if (!targetResolution.evidence.some(source => sameSource(source, judgment.invocation.source))) fail('target resolution lacks invocation-source evidence');
  if (targetResolution.kind === 'resolved' && !targetResolution.evidence.some(source => sameSource(source, targetResolution.target.source))) fail('resolved target lacks callable-source evidence');
  if (targetResolution.kind === 'ambiguous') {
    if (targetResolution.candidates.length !== targetResolution.obligation.candidateCallables.length || targetResolution.candidates.some((candidate, index) => {
      const obligationCandidate = targetResolution.obligation.candidateCallables[index];
      return obligationCandidate === undefined || !sameKnowledgeId(candidate.id, obligationCandidate.id);
    })) fail('ambiguous target candidates differ from obligation candidates');
    if (targetResolution.candidates.some(candidate => !targetResolution.evidence.some(source => sameSource(source, candidate.source)))) fail('ambiguous target lacks candidate source evidence');
  }
  if (targetResolution.kind === 'resolved') {
    if (binding.kind === 'blocked') fail('resolved target has blocked argument binding');
    if (binding.kind !== 'blocked' && binding.kind !== 'not-required' && !sameKnowledgeId(binding.target.id, targetResolution.target.id)) fail('binding target differs from resolved target');
    if (binding.kind === 'established' || binding.kind === 'incomplete') {
      if (binding.positionalEvidence.kind !== 'positional-evidence-established' || !sameKnowledgeId(binding.positionalEvidence.evidence.invocation, requestedIdentity)) fail('positional evidence belongs to another invocation');
      if (binding.positionalEvidence.evidence.normalizedArguments.length !== judgment.invocation.arguments.length ||
        binding.positionalEvidence.evidence.normalizedArguments.some((argument, index) => judgment.invocation.arguments[index] === undefined || !sameKnowledgeId(argument, judgment.invocation.arguments[index]))) {
        fail('positional evidence does not cover the exact ordered invocation arguments');
      }
    }
    if (binding.kind === 'established' || binding.kind === 'incomplete') {
      for (const disposition of binding.argumentDispositions) {
        if (disposition.kind === 'bound-argument') {
          const relation = disposition.relation;
          const claim = disposition.evidence;
          if (!sameKnowledgeId(relation.invocation.id, requestedIdentity) || !sameKnowledgeId(relation.callable.id, targetResolution.target.id)) fail('argument binding relation identity mismatch');
          if (!sameKnowledgeId(claim.invocation, requestedIdentity) || !sameKnowledgeId(claim.target, targetResolution.target.id) ||
            !sameKnowledgeId(claim.argument, relation.argument) || !sameKnowledgeId(claim.parameter, relation.parameter)) fail('argument correspondence evidence identity mismatch');
          const argumentIndex = binding.argumentDispositions.indexOf(disposition);
          const expectedParameter = targetResolution.target.parameters[argumentIndex];
          if (expectedParameter === undefined || !sameKnowledgeId(expectedParameter, relation.parameter)) fail('argument is not bound to the parameter at its proven position');
          if (claim.argumentEvidence.length === 0 || claim.parameterEvidence.length === 0 || claim.correspondenceEvidence.length === 0) fail('argument correspondence evidence is empty');
          if (!claim.argumentEvidence.some(source => sameSource(source, relation.argument.identity.source))) fail('argument claim lacks argument-identity provenance');
          if (!claim.parameterEvidence.some(source => sameSource(source, relation.parameter.identity.source))) fail('argument claim lacks parameter-identity provenance');
          if (!claim.correspondenceEvidence.some(source => sameSource(source, binding.positionalEvidence.evidence.source))) fail('argument claim lacks positional-correspondence provenance');
        } else if (disposition.kind === 'unbound-argument') {
          if (!sameKnowledgeId(disposition.obligation.invocation.id, requestedIdentity) || !sameKnowledgeId(disposition.obligation.argument, disposition.argument)) fail('unbound argument obligation identity mismatch');
        }
      }
    }
    if (binding.kind === 'argument-form-unproven' && !sameKnowledgeId(binding.obligation.invocation.id, requestedIdentity)) fail('argument-form obligation belongs to another invocation');
  } else {
    if (!isBlockedBinding(binding)) return fail('unavailable target must block argument binding');
    if (!sameKnowledgeId(binding.target.obligation.invocation.id, requestedIdentity)) fail('blocked target obligation belongs to another invocation');
    if (targetResolution.kind === 'unresolved') {
      if (binding.target.kind !== 'unresolved') fail('unresolved target is not correlated with unresolved binding');
    } else if (binding.target.kind !== 'ambiguous') fail('ambiguous target is not correlated with ambiguous binding');
    if (judgment.resultFlows.length !== 0 || judgment.exceptionFlows.length !== 0) fail('effects projected without a resolved target');
  }

  const effectFlows = [...judgment.resultFlows, ...judgment.exceptionFlows];
  if (targetResolution.kind !== 'resolved' && effectFlows.length > 0) fail('effects projected without a resolved target');
  if (targetResolution.kind === 'resolved') {
    for (const flow of effectFlows) {
      if (!sameKnowledgeId(flow.invocation.id, requestedIdentity) || !sameKnowledgeId(flow.target, requestedIdentity)) fail('effect flow invocation identity mismatch');
      if (!sameKnowledgeId(flow.callable.id, targetResolution.target.id)) fail('effect flow callable differs from resolved target');
      if (!targetResolution.target.emissions.some(emission => sameKnowledgeId(emission, flow.emission.id))) fail('effect flow emission is not declared by target callable');
      if (flow.kind === 'result-emission-flow' && flow.emission.definition.code !== 'result') fail('result flow carries non-result emission');
      if (flow.kind === 'exception-emission-flow' && flow.emission.definition.code !== 'exception') fail('exception flow carries non-exception emission');
      if (flow.invocationEvidence.length === 0 || flow.callableDeclarationEvidence.length === 0 ||
        flow.emissionDeclarationEvidence.length === 0 || flow.projectionEvidence.length === 0) fail('effect flow lacks a provenance channel');
      if (!flow.invocationEvidence.some(source => sameSource(source, flow.invocation.source))) fail('effect flow lacks invocation-source provenance');
      if (!flow.callableDeclarationEvidence.some(source => sameSource(source, flow.callable.source))) fail('effect flow lacks callable-declaration provenance');
      if (!flow.emissionDeclarationEvidence.some(source => sameSource(source, flow.emission.source))) fail('effect flow lacks emission-declaration provenance');
      if (!flow.projectionEvidence.some(source => sameSource(source, flow.callable.source)) ||
        !flow.projectionEvidence.some(source => sameSource(source, flow.emission.source))) fail('effect flow lacks projection-membership provenance');
    }
  }

  const trace = judgment.proof.ruleTrace;
  const expectedRuleIds: readonly InvocationSemanticJudgment['proof']['ruleTrace'][number]['ruleId'][] = [...INVOCATION_SEMANTIC_CONTRACT.executableRuleIds, 'invocation-judgment-closure'];
  const actualRuleIds: InvocationSemanticJudgment['proof']['ruleTrace'][number]['ruleId'][] = [];
  for (const entry of trace) actualRuleIds.push(entry.ruleId);
  if (actualRuleIds.length !== expectedRuleIds.length) fail('rule trace does not cover every declared rule exactly once');
  if (new Set(actualRuleIds).size !== actualRuleIds.length) fail('rule trace contains duplicate rule entries');
  if (expectedRuleIds.some(ruleId => !actualRuleIds.includes(ruleId))) fail('rule trace contains a missing declared rule');
  if (trace.some(entry => !sameKnowledgeId(entry.subjectInvocation, requestedIdentity))) fail('trace subject identity differs from request');
  if (trace.some(entry => entry.obligationCount !== entry.obligations.length)) fail('trace obligation count differs from obligation list');
  if (trace.some(entry => entry.witnesses.some(witness => invocationSemanticWitnessOwnership.ownerOf(witness) !== entry.ruleId))) fail('trace contains a witness owned by another semantic phase');
  if (judgment.proof.derivation.witnesses.some(witness => !sameKnowledgeId(witnessInvocationId(witness), requestedIdentity))) fail('domain derivation witness belongs to another invocation');
  if (judgment.proof.derivation.status !== judgment.status) fail('domain derivation status differs from judgment status');
  const derivationWitnesses = judgment.proof.derivation.witnesses;
  if (trace.some(entry => entry.witnesses.some(witness => !derivationWitnesses.includes(witness)))) fail('trace references a witness absent from the domain proof');
  const closureEntry = trace.find(entry => entry.ruleId === 'invocation-judgment-closure');
  if (!closureEntry || closureEntry.outcome !== judgment.status) fail('closure trace differs from judgment status');

  const proofObligations = judgment.proof.unresolvedObligations;
  if (proofObligations.length !== judgment.unresolvedObligations.length) fail('judgment and proof obligation sets differ in size');
  if (proofObligations.some((obligation, index) => {
    const judgmentObligation = judgment.unresolvedObligations[index];
    return judgmentObligation === undefined || !sameObligationIdentity(judgmentObligation, obligation);
  })) fail('judgment and proof obligation witnesses disagree');

  if (judgment.status === 'closed') {
    if (targetResolution.kind !== 'resolved') fail('closed judgment must have resolved target');
    if (binding.kind !== 'not-required' && binding.kind !== 'established') fail('closed judgment has incomplete argument binding');
    if (judgment.proof.status !== 'closed') fail('closed judgment has incomplete proof');
    if (judgment.unresolvedObligations.length !== 0) fail('closed judgment retains unresolved obligations');
    if (judgment.proof.derivation.status !== 'closed') fail('closed judgment has incomplete domain derivation');
    if (judgment.proof.closure !== 'all-obligations-discharged') fail('closed judgment has invalid closure certificate');
  } else {
    if (judgment.proof.status !== 'incomplete') fail('incomplete judgment has closed proof');
    if (judgment.unresolvedObligations.length === 0) fail('incomplete judgment has no unresolved closure reason');
  }
  return judgment;
};

/** One typed owner for invocation contract validation; helpers stay private to this authority module. */
export const invocationSemanticContractOperations: InvocationSemanticContractOperationsInterface = Object.freeze({
  validateInput: validateInvocationSemanticInput,
  validateJudgment: validateInvocationSemanticJudgment,
});

export const invocationSemanticAuthority: InvocationSemanticAuthorityInterface = Object.freeze({
  kind: 'invocation_semantic_authority',
  contract: INVOCATION_SEMANTIC_CONTRACT,
  analyze: (input: InvocationSemanticInput): InvocationSemanticJudgment => {
    const validatedInput = invocationSemanticContractOperations.validateInput(input);
    return invocationSemanticContractOperations.validateJudgment(
      validatedInput,
      invocationSemanticKnowledgeAlgebraOperations.analyzeOne(validatedInput.knowledge, validatedInput.invocation, validatedInput.positionalEvidence),
    );
  },
});

const analyzeWholeSemanticKnowledge = (knowledge: SemanticKnowledgeDataFlow): InvocationSemanticAnalysis => {
  const analysis = invocationSemanticKnowledgeAlgebraOperations.analyze(knowledge);
  for (const judgment of analysis.judgments) invocationSemanticContractOperations.validateJudgment(
    { knowledge, invocation: judgment.invocation, positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(judgment.invocation) }, judgment,
  );
  return analysis;
};

export const semanticInterproceduralDataFlowAuthority: SemanticInterproceduralDataFlowAuthorityInterface = Object.freeze({
  kind: 'invocation_semantic_batch_authority',
  contract: INVOCATION_SEMANTIC_CONTRACT,
  analyze: analyzeWholeSemanticKnowledge,
});
export { invocationSemanticKnowledgeAlgebraOperations };

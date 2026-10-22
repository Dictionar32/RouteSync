/** Authority validates the staged algebra judgment before any downstream consumer sees it. */
import { knowledgeIdKey, type KnowledgeId, type SemanticKnowledgeDataFlow, type SemanticSource } from './semanticDataflowKnowledge';
import type {
  InvocationArgumentBindingJudgment,
  InvocationSemanticAnalysis,
  InvocationSemanticAuthorityInterface,
  SemanticInterproceduralDataFlowAuthorityInterface,
  InvocationSemanticDerivationWitness,
  InvocationSemanticInput,
  InvocationSemanticJudgment,
  SemanticArgumentParameterFlow,
  SemanticInvocationObligation,
} from './invocationSemanticJudgmentInterface';
import { INVOCATION_SEMANTIC_CONTRACT, invocationWitnessOwnerRuleId } from './invocationSemanticJudgmentInterface';
import {
  analyzeInvocationJudgmentAlgebra,
  invocationPositionalEvidenceUnproven,
  analyzeInvocationSemanticAlgebra,
  callTargetForInvocation,
  parameterFlowsForInvocation,
} from './invocationSemanticJudgmentAlgebra';

const id = (knowledgeId: KnowledgeId): string => knowledgeIdKey(knowledgeId);
const sourceKey = (source: SemanticSource): string => JSON.stringify([
  source.filePath.value,
  source.span.start.value,
  source.span.end.value,
  source.evidence.code,
]);

/** Stable value identity for an invocation; matching KnowledgeId alone is insufficient. */
const invocationShapeKey = (invocation: InvocationSemanticInput['invocation']): string => {
  const receiver = invocation.receiver.kind === 'present'
    ? `present:${id(invocation.receiver.value)}`
    : `absent:${invocation.receiver.reason.code}`;
  return JSON.stringify([
    id(invocation.id),
    receiver,
    invocation.operation.name.value,
    invocation.arguments.map(id),
    sourceKey(invocation.source),
  ]);
};

const witnessInvocationId = (witness: InvocationSemanticDerivationWitness): KnowledgeId =>
  witness.kind === 'argument-binding' ? witness.judgment.invocation.id : witness.invocation;

const isBlockedBinding = (binding: InvocationArgumentBindingJudgment): binding is Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> => binding.kind === 'blocked';

const obligationKey = (obligation: SemanticInvocationObligation): string => {
  const argumentPart = obligation.kind === 'argument_parameter_unresolved' ? `:${id(obligation.argument)}` : '';
  const candidatePart = obligation.kind === 'callable_target_ambiguous'
    ? `:${obligation.candidateCallables.map(candidate => id(candidate.id)).join(',')}`
    : '';
  return `${obligation.kind}:${id(obligation.invocation.id)}${argumentPart}${candidatePart}`;
};

/**
 * Reject malformed evidence at the authority boundary before the algebra can
 * reinterpret it as an unresolved semantic outcome. This validates the input
 * contract; it does not derive invocation meaning.
 */
export const assertInvocationSemanticInputContract = (input: InvocationSemanticInput): InvocationSemanticInput => {
  const requestedIdentity = id(input.invocation.id);
  const fail = (invariant: string): never => {
    throw new Error(`Invocation semantic input contract violation: ${invariant}`);
  };
  const sameIdentityFacts = input.knowledge.facts.filter(
    (fact): fact is Extract<SemanticKnowledgeDataFlow['facts'][number], { readonly kind: 'invocation' }> =>
      fact.kind === 'invocation' && id(fact.value.id) === requestedIdentity,
  );
  sameIdentityFacts.forEach(fact => {
    if (invocationShapeKey(fact.value) !== invocationShapeKey(input.invocation)) {
      fail('requested invocation reuses a knowledge identity with different receiver, operation, ordered arguments, or source provenance');
    }
  });
  switch (input.positionalEvidence.kind) {
    case 'positional-evidence-established': {
      const evidence = input.positionalEvidence.evidence;
      if (id(evidence.invocation) !== requestedIdentity) fail('positional evidence belongs to another invocation');
      if (evidence.normalizedArguments.length !== input.invocation.arguments.length ||
        evidence.normalizedArguments.some((argument, index) => {
          const requestedArgument = input.invocation.arguments[index];
          return requestedArgument === undefined || id(argument) !== id(requestedArgument);
        })) fail('positional evidence does not cover the exact ordered invocation arguments');
      return input;
    }
    case 'positional-evidence-unproven':
      if (invocationShapeKey(input.positionalEvidence.obligation.invocation) !== invocationShapeKey(input.invocation)) {
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
    if (expected === undefined || id(expected) !== id(actual)) fail('argument disposition order or identity differs from invocation.arguments');
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
export const assertInvocationSemanticJudgmentContract = (
  input: InvocationSemanticInput,
  judgment: InvocationSemanticJudgment,
): InvocationSemanticJudgment => {
  const requestedIdentity = id(input.invocation.id);
  const fail = (invariant: string): never => {
    throw new Error(`Invocation semantic contract violation: ${invariant}`);
  };
  if (judgment.kind !== 'invocation_semantic_judgment') fail('unexpected judgment kind');
  if (requestedIdentity !== id(judgment.invocation.id)) fail('result invocation identity differs from request');
  if (requestedIdentity !== id(judgment.targetResolution.invocation.id)) fail('target-resolution invocation identity differs from request');
  if (requestedIdentity !== id(judgment.argumentBinding.invocation.id)) fail('argument-binding invocation identity differs from request');
  const invocationIsPresent = input.knowledge.facts.some(fact =>
    fact.kind === 'invocation' && invocationShapeKey(fact.value) === invocationShapeKey(input.invocation),
  );
  const hasMissingInvocationObligation = judgment.unresolvedObligations.some(obligation => obligation.kind === 'invocation_evidence_missing');
  if (!invocationIsPresent && !hasMissingInvocationObligation) fail('absent invocation lacks its missing-evidence obligation');
  if (invocationIsPresent && hasMissingInvocationObligation) fail('present invocation incorrectly carries missing-evidence obligation');
  assertArgumentCoverage(judgment.invocation, judgment.argumentBinding, fail);

  const targetResolution = judgment.targetResolution;
  const binding = judgment.argumentBinding;
  if (!targetResolution.evidence.some(source => sourceKey(source) === sourceKey(judgment.invocation.source))) fail('target resolution lacks invocation-source evidence');
  if (targetResolution.kind === 'resolved' && !targetResolution.evidence.some(source => sourceKey(source) === sourceKey(targetResolution.target.source))) fail('resolved target lacks callable-source evidence');
  if (targetResolution.kind === 'ambiguous') {
    if (targetResolution.candidates.length !== targetResolution.obligation.candidateCallables.length || targetResolution.candidates.some((candidate, index) => {
      const obligationCandidate = targetResolution.obligation.candidateCallables[index];
      return obligationCandidate === undefined || id(candidate.id) !== id(obligationCandidate.id);
    })) fail('ambiguous target candidates differ from obligation candidates');
    if (targetResolution.candidates.some(candidate => !targetResolution.evidence.some(source => sourceKey(source) === sourceKey(candidate.source)))) fail('ambiguous target lacks candidate source evidence');
  }
  if (targetResolution.kind === 'resolved') {
    if (binding.kind === 'blocked') fail('resolved target has blocked argument binding');
    if (binding.kind !== 'blocked' && binding.kind !== 'not-required' && id(binding.target.id) !== id(targetResolution.target.id)) fail('binding target differs from resolved target');
    if (binding.kind === 'established' || binding.kind === 'incomplete') {
      if (binding.positionalEvidence.kind !== 'positional-evidence-established' || id(binding.positionalEvidence.evidence.invocation) !== requestedIdentity) fail('positional evidence belongs to another invocation');
      if (binding.positionalEvidence.evidence.normalizedArguments.length !== judgment.invocation.arguments.length ||
        binding.positionalEvidence.evidence.normalizedArguments.some((argument, index) => judgment.invocation.arguments[index] === undefined || id(argument) !== id(judgment.invocation.arguments[index]))) {
        fail('positional evidence does not cover the exact ordered invocation arguments');
      }
    }
    if (binding.kind === 'established' || binding.kind === 'incomplete') {
      for (const disposition of binding.argumentDispositions) {
        if (disposition.kind === 'bound-argument') {
          const relation = disposition.relation;
          const claim = disposition.evidence;
          if (id(relation.invocation.id) !== requestedIdentity || id(relation.callable.id) !== id(targetResolution.target.id)) fail('argument binding relation identity mismatch');
          if (id(claim.invocation) !== requestedIdentity || id(claim.target) !== id(targetResolution.target.id) ||
            id(claim.argument) !== id(relation.argument) || id(claim.parameter) !== id(relation.parameter)) fail('argument correspondence evidence identity mismatch');
          const argumentIndex = binding.argumentDispositions.indexOf(disposition);
          const expectedParameter = targetResolution.target.parameters[argumentIndex];
          if (expectedParameter === undefined || id(expectedParameter) !== id(relation.parameter)) fail('argument is not bound to the parameter at its proven position');
          if (claim.argumentEvidence.length === 0 || claim.parameterEvidence.length === 0 || claim.correspondenceEvidence.length === 0) fail('argument correspondence evidence is empty');
          if (!claim.argumentEvidence.some(source => sourceKey(source) === sourceKey(relation.argument.identity.source))) fail('argument claim lacks argument-identity provenance');
          if (!claim.parameterEvidence.some(source => sourceKey(source) === sourceKey(relation.parameter.identity.source))) fail('argument claim lacks parameter-identity provenance');
          if (!claim.correspondenceEvidence.some(source => sourceKey(source) === sourceKey(binding.positionalEvidence.evidence.source))) fail('argument claim lacks positional-correspondence provenance');
        } else if (disposition.kind === 'unbound-argument') {
          if (id(disposition.obligation.invocation.id) !== requestedIdentity || id(disposition.obligation.argument) !== id(disposition.argument)) fail('unbound argument obligation identity mismatch');
        }
      }
    }
    if (binding.kind === 'argument-form-unproven' && id(binding.obligation.invocation.id) !== requestedIdentity) fail('argument-form obligation belongs to another invocation');
  } else {
    if (!isBlockedBinding(binding)) return fail('unavailable target must block argument binding');
    if (id(binding.target.obligation.invocation.id) !== requestedIdentity) fail('blocked target obligation belongs to another invocation');
    if (targetResolution.kind === 'unresolved') {
      if (binding.target.kind !== 'unresolved') fail('unresolved target is not correlated with unresolved binding');
    } else if (binding.target.kind !== 'ambiguous') fail('ambiguous target is not correlated with ambiguous binding');
    if (judgment.resultFlows.length !== 0 || judgment.exceptionFlows.length !== 0) fail('effects projected without a resolved target');
  }

  const effectFlows = [...judgment.resultFlows, ...judgment.exceptionFlows];
  if (targetResolution.kind !== 'resolved' && effectFlows.length > 0) fail('effects projected without a resolved target');
  if (targetResolution.kind === 'resolved') {
    for (const flow of effectFlows) {
      if (id(flow.invocation.id) !== requestedIdentity || id(flow.target) !== requestedIdentity) fail('effect flow invocation identity mismatch');
      if (id(flow.callable.id) !== id(targetResolution.target.id)) fail('effect flow callable differs from resolved target');
      if (!targetResolution.target.emissions.some(emission => id(emission) === id(flow.emission.id))) fail('effect flow emission is not declared by target callable');
      if (flow.kind === 'result-emission-flow' && flow.emission.definition.code !== 'result') fail('result flow carries non-result emission');
      if (flow.kind === 'exception-emission-flow' && flow.emission.definition.code !== 'exception') fail('exception flow carries non-exception emission');
      if (flow.invocationEvidence.length === 0 || flow.callableDeclarationEvidence.length === 0 ||
        flow.emissionDeclarationEvidence.length === 0 || flow.projectionEvidence.length === 0) fail('effect flow lacks a provenance channel');
      if (!flow.invocationEvidence.some(source => sourceKey(source) === sourceKey(flow.invocation.source))) fail('effect flow lacks invocation-source provenance');
      if (!flow.callableDeclarationEvidence.some(source => sourceKey(source) === sourceKey(flow.callable.source))) fail('effect flow lacks callable-declaration provenance');
      if (!flow.emissionDeclarationEvidence.some(source => sourceKey(source) === sourceKey(flow.emission.source))) fail('effect flow lacks emission-declaration provenance');
      if (!flow.projectionEvidence.some(source => sourceKey(source) === sourceKey(flow.callable.source)) ||
        !flow.projectionEvidence.some(source => sourceKey(source) === sourceKey(flow.emission.source))) fail('effect flow lacks projection-membership provenance');
    }
  }

  const trace = judgment.proof.ruleTrace;
  const expectedRuleIds: readonly InvocationSemanticJudgment['proof']['ruleTrace'][number]['ruleId'][] = [...INVOCATION_SEMANTIC_CONTRACT.executableRuleIds, 'invocation-judgment-closure'];
  const actualRuleIds = trace.map(entry => entry.ruleId);
  if (actualRuleIds.length !== expectedRuleIds.length) fail('rule trace does not cover every declared rule exactly once');
  if (new Set(actualRuleIds).size !== actualRuleIds.length) fail('rule trace contains duplicate rule entries');
  if (expectedRuleIds.some(ruleId => !actualRuleIds.includes(ruleId))) fail('rule trace contains a missing declared rule');
  if (trace.some(entry => id(entry.subjectInvocation) !== requestedIdentity)) fail('trace subject identity differs from request');
  if (trace.some(entry => entry.obligationCount !== entry.obligations.length)) fail('trace obligation count differs from obligation list');
  if (trace.some(entry => entry.witnesses.some(witness => invocationWitnessOwnerRuleId(witness) !== entry.ruleId))) fail('trace contains a witness owned by another semantic phase');
  if (judgment.proof.derivation.witnesses.some(witness => id(witnessInvocationId(witness)) !== requestedIdentity)) fail('domain derivation witness belongs to another invocation');
  if (judgment.proof.derivation.status !== judgment.status) fail('domain derivation status differs from judgment status');
  const derivationWitnesses = judgment.proof.derivation.witnesses;
  if (trace.some(entry => entry.witnesses.some(witness => !derivationWitnesses.includes(witness)))) fail('trace references a witness absent from the domain proof');
  const closureEntry = trace.find(entry => entry.ruleId === 'invocation-judgment-closure');
  if (!closureEntry || closureEntry.outcome !== judgment.status) fail('closure trace differs from judgment status');

  const proofObligations = judgment.proof.unresolvedObligations;
  if (proofObligations.length !== judgment.unresolvedObligations.length) fail('judgment and proof obligation sets differ in size');
  if (proofObligations.some((obligation, index) => {
    const judgmentObligation = judgment.unresolvedObligations[index];
    return judgmentObligation === undefined || obligationKey(judgmentObligation) !== obligationKey(obligation);
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

export const invocationSemanticAuthority: InvocationSemanticAuthorityInterface = Object.freeze({
  kind: 'invocation_semantic_authority',
  contract: INVOCATION_SEMANTIC_CONTRACT,
  analyze: (input: InvocationSemanticInput): InvocationSemanticJudgment => {
    const validatedInput = assertInvocationSemanticInputContract(input);
    return assertInvocationSemanticJudgmentContract(
      validatedInput,
      analyzeInvocationJudgmentAlgebra(validatedInput.knowledge, validatedInput.invocation, validatedInput.positionalEvidence),
    );
  },
});

export const analyzeInvocationSemantics = invocationSemanticAuthority.analyze;

export const analyzeAllInvocationSemantics = (knowledge: SemanticKnowledgeDataFlow): InvocationSemanticAnalysis => {
  const analysis = analyzeInvocationSemanticAlgebra(knowledge);
  for (const judgment of analysis.judgments) assertInvocationSemanticJudgmentContract(
    { knowledge, invocation: judgment.invocation, positionalEvidence: invocationPositionalEvidenceUnproven(judgment.invocation) }, judgment,
  );
  return analysis;
};

export const semanticInterproceduralDataFlowAuthority: SemanticInterproceduralDataFlowAuthorityInterface = Object.freeze({
  kind: 'invocation_semantic_batch_authority',
  contract: INVOCATION_SEMANTIC_CONTRACT,
  analyze: analyzeAllInvocationSemantics,
});
export const analyzeSemanticInterproceduralDataFlow = analyzeAllInvocationSemantics;
export const callTargetFor = callTargetForInvocation;
export const parameterFlowsFor = (
  analysis: InvocationSemanticAnalysis,
  invocation: KnowledgeId,
): readonly SemanticArgumentParameterFlow[] => parameterFlowsForInvocation(analysis, invocation);

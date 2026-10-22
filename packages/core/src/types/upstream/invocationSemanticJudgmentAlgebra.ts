/**
 * Invocation-domain semantic algebra.
 * Internal staged derivation implementation retained behind the high-level
 * InvocationSemanticAlgebraBoundaryInterface. Its phases are not caller-facing APIs.
 */
import type {
  KnowledgeId,
  SemanticCallable,
  SemanticEmission,
  SemanticInvocation,
  SemanticKnowledgeDataFlow,
  SemanticSource,
} from './semanticDataflowKnowledge';
import { knowledgeIdKey } from './semanticDataflowKnowledge';
import type {
  InvocationArgumentBindingClaim,
  InvocationArgumentBindingJudgment,
  InvocationArgumentCorrespondenceEvidence,
  InvocationArgumentFormUnprovenDisposition,
  InvocationArgumentBindingUnavailableTarget,
  InvocationIncompleteArgumentDisposition,
  InvocationPositionalArgumentEvidence,
  InvocationPositionalEvidenceInput,
  InvocationResultEmissionFlow,
  InvocationExceptionEmissionFlow,
  InvocationSemanticAnalysis,
  InvocationSemanticDerivationWitness,
  InvocationSemanticDerivationWitnesses,
  InvocationSemanticEvidence,
  InvocationSemanticInput,
  InvocationSemanticJudgment,
  InvocationSemanticProof,
  InvocationSemanticRuleTraceEntry,
  InvocationTargetResolutionJudgment,
  SemanticArgumentParameterFlow,
  SemanticCallEmissionFlow,
  SemanticCallTarget,
  SemanticInvocationObligation,
} from './invocationSemanticJudgmentInterface';
import {
  INVOCATION_SEMANTIC_CONTRACT,
  invocationSemanticRulePolicy,
  invocationWitnessOwnerRuleId,
} from './invocationSemanticJudgmentInterface';
import type {
  InvocationArgumentBindingAlgebraInput,
  InvocationEffectProjectionAlgebraInput,
  InvocationEffectProjectionJudgment,
  InvocationJudgmentClosureAlgebraInput,
  InvocationSemanticAlgebraInterface,
  InvocationTargetResolutionAlgebraInput,
} from './invocationSemanticAlgebraInterface';
import { INVOCATION_SEMANTIC_ALGEBRA_CONTRACT } from './invocationSemanticAlgebraInterface';

const key = (id: KnowledgeId): string => knowledgeIdKey(id);
const hasArguments = (invocation: SemanticInvocation): invocation is SemanticInvocation & { readonly arguments: readonly [KnowledgeId, ...KnowledgeId[]] } => invocation.arguments.length > 0;
const isNonEmpty = <T>(items: readonly T[]): items is readonly [T, ...T[]] => items.length > 0;
const emptyObligations: readonly [] = Object.freeze([]);
const emptyEmissionFlows: readonly [] = Object.freeze([]);
const emptyCandidateList: readonly [] = Object.freeze([]);

const uniqueByIdentity = <T>(items: readonly T[], identity: (item: T) => string): readonly T[] => {
  const seen = new Set<string>();
  return Object.freeze(items.filter(item => {
    const id = identity(item);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }));
};

const sourceKey = (source: SemanticSource): string =>
  `${source.filePath.value}:${source.span.start.value}:${source.span.end.value}:${source.evidence.code}`;

const uniqueSources = (sources: readonly SemanticSource[]): readonly SemanticSource[] => uniqueByIdentity(sources, sourceKey);

const evidence = (...sources: readonly SemanticSource[]): InvocationSemanticEvidence => {
  const distinct = uniqueSources(sources);
  if (distinct.length === 0) throw new Error('Invocation semantic derivation requires source-backed evidence');
  const [first, ...rest] = distinct;
  if (first === undefined) throw new Error('Invocation semantic derivation requires source-backed evidence');
  return Object.freeze([first, ...rest]);
};

const invocationsFrom = (knowledge: SemanticKnowledgeDataFlow): readonly SemanticInvocation[] =>
  knowledge.facts.flatMap(fact => fact.kind === 'invocation' ? [fact.value] : []);

const callablesFrom = (knowledge: SemanticKnowledgeDataFlow): readonly SemanticCallable[] =>
  knowledge.facts.flatMap(fact => fact.kind === 'callable' ? [fact.value] : []);

const emissionsFrom = (knowledge: SemanticKnowledgeDataFlow): readonly SemanticEmission[] =>
  knowledge.facts.flatMap(fact => fact.kind === 'emission' ? [fact.value] : []);

const invocationPresent = (knowledge: SemanticKnowledgeDataFlow, invocation: SemanticInvocation): boolean =>
  invocationsFrom(knowledge).some(candidate => key(candidate.id) === key(invocation.id));

const candidateCallablesFor = (
  knowledge: SemanticKnowledgeDataFlow,
  invocation: SemanticInvocation,
): readonly SemanticCallable[] => {
  const targetIds = new Set(knowledge.dataFlow
    .filter(flow => key(flow.source) === key(invocation.id) && flow.role.code === INVOCATION_SEMANTIC_CONTRACT.meaning.identity.targetEvidenceRole)
    .map(flow => key(flow.target)));
  return uniqueByIdentity(
    callablesFrom(knowledge).filter(callable => targetIds.has(key(callable.id))),
    callable => key(callable.id),
  );
};

const targetSources = (
  invocation: SemanticInvocation,
  candidates: readonly SemanticCallable[],
): InvocationSemanticEvidence => evidence(invocation.source, ...candidates.map(candidate => candidate.source));

const argumentSource = (argument: KnowledgeId): SemanticSource => argument.identity.source;
const parameterSource = (parameter: KnowledgeId): SemanticSource => parameter.identity.source;

const positionalEvidenceMatches = (
  invocation: SemanticInvocation,
  positionalEvidence: InvocationPositionalArgumentEvidence,
): boolean => key(positionalEvidence.invocation) === key(invocation.id) &&
  positionalEvidence.normalizedArguments.length === invocation.arguments.length &&
  positionalEvidence.normalizedArguments.every((argument, index) => {
    const expected = invocation.arguments[index];
    return expected !== undefined && key(argument) === key(expected);
  });


const bindingEvidence = (
  invocation: SemanticInvocation,
  callable: SemanticCallable,
  positionalEvidence: InvocationPositionalArgumentEvidence,
): InvocationSemanticEvidence => evidence(invocation.source, callable.source, positionalEvidence.source);

const bindingClaim = (
  invocation: SemanticInvocation,
  callable: SemanticCallable,
  argument: KnowledgeId,
  parameter: KnowledgeId,
  positionalEvidence: InvocationPositionalArgumentEvidence,
): InvocationArgumentBindingClaim => {
  const relation: SemanticArgumentParameterFlow = Object.freeze({ invocation, callable, argument, parameter });
  const correspondence: InvocationArgumentCorrespondenceEvidence = Object.freeze({
    kind: 'invocation_argument_correspondence_evidence',
    invocation: invocation.id,
    target: callable.id,
    argument,
    parameter,
    argumentEvidence: evidence(argumentSource(argument)),
    parameterEvidence: evidence(parameterSource(parameter)),
    correspondenceEvidence: evidence(positionalEvidence.source),
    basis: 'confirmed-positional-order',
  });
  return Object.freeze({ kind: 'bound-argument', relation, evidence: correspondence });
};

const argumentFormObligation = (invocation: SemanticInvocation): Extract<SemanticInvocationObligation, { readonly kind: 'argument_form_unproven' }> =>
  Object.freeze({
    kind: 'argument_form_unproven',
    reason: 'ordered-identities-do-not-prove-positional-argument-semantics',
    invocation,
  });

export const invocationPositionalEvidenceUnproven = (invocation: SemanticInvocation): InvocationPositionalEvidenceInput =>
  Object.freeze({ kind: 'positional-evidence-unproven', obligation: argumentFormObligation(invocation) });

const deriveTargetResolution = (input: InvocationTargetResolutionAlgebraInput): InvocationTargetResolutionJudgment => {
  const candidates = candidateCallablesFor(input.knowledge, input.invocation);
  const candidateEvidence = targetSources(input.invocation, candidates);
  if (candidates.length === 1) {
    const [target] = candidates;
    if (target === undefined) throw new Error('Resolved target candidate is missing');
    return Object.freeze({ kind: 'resolved', invocation: input.invocation, target, evidence: candidateEvidence });
  }
  if (candidates.length === 0) return Object.freeze({
    kind: 'unresolved',
    invocation: input.invocation,
    candidates: emptyCandidateList,
    obligation: Object.freeze({
      kind: 'callable_target_unresolved',
      reason: 'no_resolved_callable_target',
      invocation: input.invocation,
    }),
    evidence: candidateEvidence,
  });
  const [first, second, ...remaining] = candidates;
  if (first === undefined || second === undefined) throw new Error('Ambiguous target requires at least two distinct callable candidates');
  const ambiguousCandidates: readonly [SemanticCallable, SemanticCallable, ...SemanticCallable[]] = Object.freeze([first, second, ...remaining]);
  return Object.freeze({
    kind: 'ambiguous',
    invocation: input.invocation,
    candidates: ambiguousCandidates,
    obligation: Object.freeze({
      kind: 'callable_target_ambiguous',
      reason: 'multiple_distinct_resolved_callable_targets',
      invocation: input.invocation,
      candidateCallables: ambiguousCandidates,
    }),
    evidence: candidateEvidence,
  });
};

const deriveArgumentBinding = (input: InvocationArgumentBindingAlgebraInput): InvocationArgumentBindingJudgment => {
  const { invocation, targetResolution } = input;
  const positionalEvidenceInput = input.positionalEvidence;
  const positionalEvidenceEstablished = positionalEvidenceInput.kind === 'positional-evidence-established';
  if (key(targetResolution.invocation.id) !== key(invocation.id)) {
    throw new Error('Argument binding cannot consume a target judgment for another invocation');
  }
  if (targetResolution.kind === 'unresolved') {
    const target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'unresolved' }> = Object.freeze({
      kind: 'unresolved', candidates: emptyCandidateList, obligation: targetResolution.obligation,
    });
    const dispositions = Object.freeze(invocation.arguments.map(argument => Object.freeze({
      kind: 'binding-unavailable-argument' as const,
      argument,
      targetStatus: 'unresolved' as const,
      obligation: targetResolution.obligation,
      evidence: evidence(invocation.source, argumentSource(argument)),
    })));
    return Object.freeze({
      kind: 'blocked', invocation, target,
      argumentDispositions: dispositions,
      positionalEvidence: Object.freeze({ kind: 'positional-evidence-not-assessable', targetStatus: 'unresolved' }),
      evidence: targetResolution.evidence,
    });
  }
  if (targetResolution.kind === 'ambiguous') {
    const target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'ambiguous' }> = Object.freeze({
      kind: 'ambiguous', candidates: targetResolution.candidates, obligation: targetResolution.obligation,
    });
    const dispositions = Object.freeze(invocation.arguments.map(argument => Object.freeze({
      kind: 'binding-unavailable-argument' as const,
      argument,
      targetStatus: 'ambiguous' as const,
      obligation: targetResolution.obligation,
      evidence: evidence(invocation.source, argumentSource(argument), ...targetResolution.candidates.map(candidate => candidate.source)),
    })));
    return Object.freeze({
      kind: 'blocked', invocation, target,
      argumentDispositions: dispositions,
      positionalEvidence: Object.freeze({ kind: 'positional-evidence-not-assessable', targetStatus: 'ambiguous' }),
      evidence: targetResolution.evidence,
    });
  }

  const target = targetResolution.target;
  if (!hasArguments(invocation)) {
    const noArguments: readonly [] = Object.freeze([]);
    const emptyInvocation: SemanticInvocation & { readonly arguments: readonly [] } = Object.freeze({ ...invocation, arguments: noArguments });
    return Object.freeze({
      kind: 'not-required', invocation: emptyInvocation, target,
      argumentDispositions: noArguments, positionalEvidence: Object.freeze({ kind: 'positional-evidence-not-required' }), evidence: targetResolution.evidence,
    });
  }

  if (positionalEvidenceInput.kind !== 'positional-evidence-established' || !positionalEvidenceMatches(invocation, positionalEvidenceInput.evidence)) {
    const obligation = positionalEvidenceInput.kind === 'positional-evidence-unproven'
      ? positionalEvidenceInput.obligation
      : argumentFormObligation(invocation);
    const dispositionItems = Object.freeze(invocation.arguments.map(argument => Object.freeze({
      kind: 'argument-form-unproven' as const,
      argument,
      obligation,
      evidence: evidence(invocation.source, argumentSource(argument), target.source),
    })));
    if (!isNonEmpty(dispositionItems)) throw new Error('Argument-form-unproven requires at least one argument');
    const dispositions: readonly [InvocationArgumentFormUnprovenDisposition, ...InvocationArgumentFormUnprovenDisposition[]] = dispositionItems;
    return Object.freeze({
      kind: 'argument-form-unproven', invocation, target,
      argumentDispositions: dispositions,
      positionalEvidence: Object.freeze({ kind: 'positional-evidence-unproven', obligation }),
      evidence: evidence(invocation.source, target.source, ...invocation.arguments.map(argumentSource)),
      obligation,
    });
  }

  if (positionalEvidenceInput.kind !== 'positional-evidence-established') throw new Error('Established positional evidence judgment is required for argument correspondence');
  const positionalEvidence = positionalEvidenceInput.evidence;
  const bound: InvocationArgumentBindingClaim[] = [];
  const unbound: Extract<InvocationIncompleteArgumentDisposition, { readonly kind: 'unbound-argument' }>[] = [];
  const combinedItems: InvocationIncompleteArgumentDisposition[] = [];
  invocation.arguments.forEach((argument, argumentIndex) => {
    const parameter = target.parameters[argumentIndex];
    if (parameter === undefined) {
      const disposition: Extract<InvocationIncompleteArgumentDisposition, { readonly kind: 'unbound-argument' }> = Object.freeze({
        kind: 'unbound-argument', argument,
        obligation: Object.freeze({
          kind: 'argument_parameter_unresolved', reason: 'argument_without_parameter', invocation, callable: target, argument,
        }),
        evidence: evidence(invocation.source, target.source, argumentSource(argument)),
      });
      unbound.push(disposition);
      combinedItems.push(disposition);
    } else {
      const disposition = bindingClaim(invocation, target, argument, parameter, positionalEvidence);
      bound.push(disposition);
      combinedItems.push(disposition);
    }
  });
  if (!isNonEmpty(combinedItems)) throw new Error('Non-empty invocation lost all argument dispositions');
  const combined: readonly [InvocationIncompleteArgumentDisposition, ...InvocationIncompleteArgumentDisposition[]] = Object.freeze(combinedItems);
  const completeEvidence = bindingEvidence(invocation, target, positionalEvidence);
  if (unbound.length > 0) return Object.freeze({
    kind: 'incomplete', invocation, target,
    argumentDispositions: combined,
    positionalEvidence: Object.freeze({ kind: 'positional-evidence-established', evidence: positionalEvidence }),
    evidence: evidence(...completeEvidence, ...unbound.flatMap(item => item.evidence)),
  });
  if (!isNonEmpty(bound)) throw new Error('Established binding requires at least one bound argument');
  const boundDispositions: readonly [InvocationArgumentBindingClaim, ...InvocationArgumentBindingClaim[]] = Object.freeze(bound);
  return Object.freeze({
    kind: 'established', invocation, target,
    argumentDispositions: boundDispositions,
    positionalEvidence: Object.freeze({ kind: 'positional-evidence-established', evidence: positionalEvidence }),
    evidence: completeEvidence,
  });
};

const flowForEmission = (
  invocation: SemanticInvocation,
  callable: SemanticCallable,
  emission: SemanticEmission,
): SemanticCallEmissionFlow => {
  const common = {
    invocation,
    callable,
    target: invocation.id,
    invocationEvidence: evidence(invocation.source),
    callableDeclarationEvidence: evidence(callable.source),
    emissionDeclarationEvidence: evidence(emission.source),
    projectionEvidence: evidence(callable.source, emission.source),
  };
  if (emission.definition.code === 'result') return Object.freeze({
    ...common,
    kind: 'result-emission-flow',
    emission: Object.freeze({ ...emission, definition: Object.freeze({ code: 'result' as const }) }),
  });
  return Object.freeze({
    ...common,
    kind: 'exception-emission-flow',
    emission: Object.freeze({ ...emission, definition: Object.freeze({ code: 'exception' as const }) }),
  });
};

const deriveEffectProjection = (input: InvocationEffectProjectionAlgebraInput): InvocationEffectProjectionJudgment => {
  const { invocation, targetResolution, knowledge } = input;
  if (key(targetResolution.invocation.id) !== key(invocation.id)) {
    throw new Error('Effect projection cannot consume a target judgment for another invocation');
  }
  if (targetResolution.kind === 'unresolved') {
    const unavailableObligations: readonly [Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>, ...Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_unresolved' }>[]] = Object.freeze([targetResolution.obligation]);
    return Object.freeze({ kind: 'effects-unavailable', invocation, targetResolution, resultFlows: emptyEmissionFlows, exceptionFlows: emptyEmissionFlows, evidence: targetResolution.evidence, obligations: unavailableObligations });
  }
  if (targetResolution.kind === 'ambiguous') {
    const unavailableObligations: readonly [Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>, ...Extract<SemanticInvocationObligation, { readonly kind: 'callable_target_ambiguous' }>[]] = Object.freeze([targetResolution.obligation]);
    return Object.freeze({ kind: 'effects-unavailable', invocation, targetResolution, resultFlows: emptyEmissionFlows, exceptionFlows: emptyEmissionFlows, evidence: targetResolution.evidence, obligations: unavailableObligations });
  }

  const callable = targetResolution.target;
  const declaredEmissionIds = new Set(callable.emissions.map(key));
  const declaredEmissions = emissionsFrom(knowledge).filter(emission => declaredEmissionIds.has(key(emission.id)));
  const flows = declaredEmissions.map(emission => flowForEmission(invocation, callable, emission));
  const resultFlows: readonly InvocationResultEmissionFlow[] = Object.freeze(flows.filter(
    (flow): flow is InvocationResultEmissionFlow => flow.kind === 'result-emission-flow',
  ));
  const exceptionFlows: readonly InvocationExceptionEmissionFlow[] = Object.freeze(flows.filter(
    (flow): flow is InvocationExceptionEmissionFlow => flow.kind === 'exception-emission-flow',
  ));
  return Object.freeze({
    kind: 'effects-projected',
    invocation,
    target: callable,
    resultFlows,
    exceptionFlows,
    evidence: evidence(invocation.source, callable.source, ...declaredEmissions.map(emission => emission.source)),
    obligations: emptyObligations,
  });
};

const obligationsForBinding = (binding: InvocationArgumentBindingJudgment): readonly SemanticInvocationObligation[] => {
  switch (binding.kind) {
    case 'not-required':
    case 'established': return emptyObligations;
    case 'incomplete': return Object.freeze(binding.argumentDispositions.flatMap(disposition => disposition.kind === 'unbound-argument' ? [disposition.obligation] : []));
    case 'blocked': return Object.freeze([binding.target.obligation]);
    case 'argument-form-unproven': return Object.freeze([binding.obligation]);
  }
};

const allObligations = (
  input: InvocationSemanticInput,
  targetResolution: InvocationTargetResolutionJudgment,
  binding: InvocationArgumentBindingJudgment,
): readonly SemanticInvocationObligation[] => {
  const obligations: SemanticInvocationObligation[] = [];
  if (!invocationPresent(input.knowledge, input.invocation)) obligations.push(Object.freeze({
    kind: 'invocation_evidence_missing',
    reason: 'invocation_not_present_in_semantic_knowledge',
    invocation: input.invocation,
  }));
  if (targetResolution.kind === 'unresolved' || targetResolution.kind === 'ambiguous') obligations.push(targetResolution.obligation);
  for (const obligation of obligationsForBinding(binding)) {
    if (!obligations.some(existing => existing.kind === obligation.kind && key(existing.invocation.id) === key(obligation.invocation.id) &&
      (existing.kind !== 'argument_parameter_unresolved' || obligation.kind !== 'argument_parameter_unresolved' || key(existing.argument) === key(obligation.argument)))) {
      obligations.push(obligation);
    }
  }
  return Object.freeze(obligations);
};

const witnessInvocationId = (witness: InvocationSemanticDerivationWitness): KnowledgeId =>
  witness.kind === 'argument-binding' ? witness.judgment.invocation.id : witness.invocation;

const witnessesForPhases = (
  invocation: SemanticInvocation,
  present: boolean,
  targetResolution: InvocationTargetResolutionJudgment,
  binding: InvocationArgumentBindingJudgment,
  effects: InvocationEffectProjectionJudgment,
): readonly InvocationSemanticDerivationWitness[] => {
  const targets: readonly SemanticCallTarget[] = targetResolution.kind === 'resolved'
    ? Object.freeze([Object.freeze({ invocation, callable: targetResolution.target })])
    : Object.freeze(targetResolution.candidates.map(callable => Object.freeze({ invocation, callable })));
  const targetWitness: InvocationSemanticDerivationWitness = Object.freeze({
    kind: 'target-resolution',
    invocation: invocation.id,
    targets,
    outcome: targetResolution.kind,
    evidence: targetResolution.evidence,
  });
  const witnesses: InvocationSemanticDerivationWitness[] = [
    ...(present ? [Object.freeze({ kind: 'invocation-presence' as const, invocation: invocation.id, evidence: Object.freeze([invocation.source]) })] : []),
    targetWitness,
    ...(targetResolution.kind === 'ambiguous' ? [Object.freeze({
      kind: 'target-ambiguity' as const,
      invocation: invocation.id,
      candidates: targetResolution.candidates,
      evidence: targetResolution.evidence,
    })] : []),
    Object.freeze({ kind: 'argument-binding', judgment: binding }),
    ...(binding.kind === 'incomplete' ? [Object.freeze({
      kind: 'unmatched-argument' as const,
      invocation: invocation.id,
      obligations: Object.freeze(binding.argumentDispositions.flatMap(disposition => disposition.kind === 'unbound-argument' ? [disposition.obligation] : [])),
      evidence: evidence(invocation.source, binding.target.source),
    })] : []),
    ...(effects.kind === 'effects-projected' && effects.resultFlows.length > 0 ? [Object.freeze({
      kind: 'effect-projection' as const,
      invocation: invocation.id,
      flows: effects.resultFlows,
      effect: 'result' as const,
      evidence: evidence(...effects.resultFlows.flatMap(flow => [flow.invocation.source, flow.callable.source, flow.emission.source])),
    })] : []),
    ...(effects.kind === 'effects-projected' && effects.exceptionFlows.length > 0 ? [Object.freeze({
      kind: 'effect-projection' as const,
      invocation: invocation.id,
      flows: effects.exceptionFlows,
      effect: 'exception' as const,
      evidence: evidence(...effects.exceptionFlows.flatMap(flow => [flow.invocation.source, flow.callable.source, flow.emission.source])),
    })] : []),
    ...(targetResolution.kind === 'unresolved' ? [Object.freeze({
      kind: 'unresolved-target' as const,
      invocation: invocation.id,
      evidence: targetResolution.evidence,
    })] : []),
  ];
  return Object.freeze(witnesses);
};

const traceEvidenceForRule = (
  ruleId: InvocationSemanticRuleTraceEntry['ruleId'],
  invocation: SemanticInvocation,
  targetResolution: InvocationTargetResolutionJudgment,
  binding: InvocationArgumentBindingJudgment,
  effects: InvocationEffectProjectionJudgment,
): readonly SemanticSource[] => {
  const sources: SemanticSource[] = [invocation.source];
  if (ruleId === 'invocation-target-resolution' || ruleId === 'invocation-target-ambiguity' || ruleId === 'invocation-unresolved-target-obligation') {
    sources.push(...targetResolution.evidence);
  }
  if (ruleId === 'invocation-positional-argument-binding' || ruleId === 'invocation-argument-form-evidence' || ruleId === 'invocation-argument-parameter-unresolved') {
    sources.push(...binding.evidence);
  }
  if (ruleId === 'invocation-result-emission' || ruleId === 'invocation-exception-emission') sources.push(...effects.evidence);
  if (ruleId === 'invocation-judgment-closure') {
    sources.push(...targetResolution.evidence, ...binding.evidence, ...effects.evidence);
  }
  return uniqueSources(sources);
};

const traceForPhases = (
  invocation: SemanticInvocation,
  targetResolution: InvocationTargetResolutionJudgment,
  binding: InvocationArgumentBindingJudgment,
  effects: InvocationEffectProjectionJudgment,
  obligations: readonly SemanticInvocationObligation[],
  witnesses: readonly InvocationSemanticDerivationWitness[],
): readonly InvocationSemanticRuleTraceEntry[] => Object.freeze(
  INVOCATION_SEMANTIC_CONTRACT.executableRuleIds.map(ruleId => {
    const policy = invocationSemanticRulePolicy(ruleId);
    const ruleObligations = Object.freeze(obligations.filter(obligation => policy.obligations.includes(obligation.kind)));
    const common = {
      subjectInvocation: invocation.id,
      evidence: traceEvidenceForRule(ruleId, invocation, targetResolution, binding, effects),
      obligations: ruleObligations,
      outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : 'no-conclusion' as const,
      obligationCount: ruleObligations.length,
    };
    switch (ruleId) {
      case 'invocation-evidence-presence': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'invocation-presence' }> => witness.kind === 'invocation-presence'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
      case 'invocation-target-resolution': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'target-resolution' }> => witness.kind === 'target-resolution'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
      case 'invocation-target-ambiguity': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'target-ambiguity' }> => witness.kind === 'target-ambiguity'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
      case 'invocation-positional-argument-binding': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'argument-binding' }> => witness.kind === 'argument-binding'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
      case 'invocation-argument-form-evidence':
        return Object.freeze({ ...common, ruleId, witnesses: Object.freeze([]), derivedWitnessCount: 0 });
      case 'invocation-argument-parameter-unresolved': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'unmatched-argument' }> => witness.kind === 'unmatched-argument'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
      case 'invocation-result-emission': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'effect-projection'; readonly effect: 'result' }> => witness.kind === 'effect-projection' && witness.effect === 'result'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
      case 'invocation-exception-emission': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'effect-projection'; readonly effect: 'exception' }> => witness.kind === 'effect-projection' && witness.effect === 'exception'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
      case 'invocation-unresolved-target-obligation': {
        const owned = Object.freeze(witnesses.filter((witness): witness is Extract<InvocationSemanticDerivationWitness, { readonly kind: 'unresolved-target' }> => witness.kind === 'unresolved-target'));
        return Object.freeze({ ...common, ruleId, witnesses: owned, derivedWitnessCount: owned.length, outcome: ruleObligations.length > 0 ? 'obligation-emitted' as const : owned.length > 0 ? 'derived' as const : 'no-conclusion' as const });
      }
    }
  }),
);

const isBlockedUnresolvedBinding = (binding: InvocationArgumentBindingJudgment): binding is Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> & Readonly<{ readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'unresolved' }> }> => binding.kind === 'blocked' && binding.target.kind === 'unresolved';
const isBlockedAmbiguousBinding = (binding: InvocationArgumentBindingJudgment): binding is Extract<InvocationArgumentBindingJudgment, { readonly kind: 'blocked' }> & Readonly<{ readonly target: Extract<InvocationArgumentBindingUnavailableTarget, { readonly kind: 'ambiguous' }> }> => binding.kind === 'blocked' && binding.target.kind === 'ambiguous';

const closeJudgment = (input: InvocationJudgmentClosureAlgebraInput): InvocationSemanticJudgment => {
  const expectedPhaseStatus: 'closed' | 'incomplete' = input.obligations.length === 0 ? 'closed' : 'incomplete';
  if (input.derivation.status !== expectedPhaseStatus) throw new Error('Phase derivation status disagrees with retained obligations');
  const expectedPhaseRuleIds = INVOCATION_SEMANTIC_CONTRACT.executableRuleIds;
  const actualPhaseRuleIds = input.ruleTrace.map(entry => entry.ruleId);
  if (actualPhaseRuleIds.length !== expectedPhaseRuleIds.length ||
    expectedPhaseRuleIds.some(ruleId => !actualPhaseRuleIds.includes(ruleId)) ||
    new Set(actualPhaseRuleIds).size !== actualPhaseRuleIds.length) {
    throw new Error('Judgment closure requires one trace entry for every executable semantic rule');
  }
  if (input.ruleTrace.some(entry => key(entry.subjectInvocation) !== key(input.invocation.id))) {
    throw new Error('Judgment closure cannot consume a phase trace for another invocation');
  }
  const closureEvidence = input.evidence;
  const closureTrace = (status: 'closed' | 'incomplete'): InvocationSemanticRuleTraceEntry => {
    const closureWitness: InvocationSemanticDerivationWitness = Object.freeze({
      kind: 'judgment-closure', invocation: input.invocation.id, status, evidence: closureEvidence,
    });
    return Object.freeze({
      ruleId: 'invocation-judgment-closure',
      subjectInvocation: input.invocation.id,
      evidence: closureEvidence,
      obligations: input.obligations,
      outcome: status,
      derivedWitnessCount: 1,
      obligationCount: input.obligations.length,
      witnesses: Object.freeze([closureWitness]),
    });
  };
  const proofEvidence = uniqueSources([...input.ruleTrace.flatMap(entry => entry.evidence), ...closureEvidence]);

  if (
    input.obligations.length === 0 &&
    input.targetResolution.kind === 'resolved' &&
    (input.argumentBinding.kind === 'not-required' || input.argumentBinding.kind === 'established') &&
    input.effectProjection.kind === 'effects-projected'
  ) {
    const closure = closureTrace('closed');
    const closureWitness = closure.witnesses[0];
    if (closureWitness === undefined) throw new Error('Closed judgment requires a closure witness');
    const witnesses = Object.freeze([...input.derivation.witnesses, closureWitness]);
    const derivation: InvocationSemanticDerivationWitnesses = Object.freeze({ kind: 'invocation_semantic_derivation', status: 'closed', witnesses });
    const ruleTrace = Object.freeze([...input.ruleTrace, closure]);
    const proof: Extract<InvocationSemanticProof, { readonly status: 'closed' }> = Object.freeze({
      kind: 'invocation_semantic_proof', status: 'closed', closure: 'all-obligations-discharged',
      evidence: proofEvidence, ruleTrace, unresolvedObligations: emptyObligations, derivation,
    });
    return Object.freeze({
      kind: 'invocation_semantic_judgment', status: 'closed', invocation: input.invocation,
      targetResolution: input.targetResolution, argumentBinding: input.argumentBinding,
      resultFlows: input.effectProjection.resultFlows, exceptionFlows: input.effectProjection.exceptionFlows,
      unresolvedObligations: emptyObligations, proof,
    });
  }

  if (input.obligations.length === 0) {
    throw new Error('Invocation closure has inconsistent phase outcomes without an unresolved obligation');
  }
  const closure = closureTrace('incomplete');
  const closureWitness = closure.witnesses[0];
  if (closureWitness === undefined) throw new Error('Incomplete judgment requires a closure witness');
  const witnesses = Object.freeze([...input.derivation.witnesses, closureWitness]);
  const derivation: InvocationSemanticDerivationWitnesses = Object.freeze({ kind: 'invocation_semantic_derivation', status: 'incomplete', witnesses });
  const ruleTrace = Object.freeze([...input.ruleTrace, closure]);
  const proof: Extract<InvocationSemanticProof, { readonly status: 'incomplete' }> = Object.freeze({
    kind: 'invocation_semantic_proof', status: 'incomplete',
    closure: input.obligations.some(obligation => obligation.kind === 'invocation_evidence_missing')
      ? 'missing-invocation-evidence' : 'unresolved-obligations',
    evidence: proofEvidence, ruleTrace, unresolvedObligations: input.obligations, derivation,
  });

  if (input.targetResolution.kind === 'resolved') {
    if (input.argumentBinding.kind === 'blocked') throw new Error('Resolved target cannot have blocked argument binding');
    const argumentBinding = input.argumentBinding;
    const resultFlows = input.effectProjection.kind === 'effects-projected' ? input.effectProjection.resultFlows : Object.freeze([]);
    const exceptionFlows = input.effectProjection.kind === 'effects-projected' ? input.effectProjection.exceptionFlows : Object.freeze([]);
    return Object.freeze({
      kind: 'invocation_semantic_judgment', status: 'incomplete', invocation: input.invocation,
      targetResolution: input.targetResolution, argumentBinding, resultFlows, exceptionFlows,
      unresolvedObligations: input.obligations, proof,
    });
  }
  if (input.targetResolution.kind === 'unresolved') {
    if (!isBlockedUnresolvedBinding(input.argumentBinding)) {
      throw new Error('Unresolved target must correlate with blocked-unresolved binding');
    }
    const argumentBinding = input.argumentBinding;
    return Object.freeze({
      kind: 'invocation_semantic_judgment', status: 'incomplete', invocation: input.invocation,
      targetResolution: input.targetResolution, argumentBinding,
      resultFlows: emptyEmissionFlows, exceptionFlows: emptyEmissionFlows,
      unresolvedObligations: input.obligations, proof,
    });
  }
  if (!isBlockedAmbiguousBinding(input.argumentBinding)) {
    throw new Error('Ambiguous target must correlate with blocked-ambiguous binding');
  }
  const argumentBinding = input.argumentBinding;
  return Object.freeze({
    kind: 'invocation_semantic_judgment', status: 'incomplete', invocation: input.invocation,
    targetResolution: input.targetResolution, argumentBinding,
    resultFlows: emptyEmissionFlows, exceptionFlows: emptyEmissionFlows,
    unresolvedObligations: input.obligations, proof,
  });
};

export const invocationSemanticAlgebra: InvocationSemanticAlgebraInterface = Object.freeze({
  kind: 'invocation_semantic_algebra',
  contract: INVOCATION_SEMANTIC_ALGEBRA_CONTRACT,
  deriveTargetResolution,
  deriveArgumentBinding,
  deriveEffectProjection,
  closeJudgment,
});

const deriveInvocationJudgment = (
  knowledge: SemanticKnowledgeDataFlow,
  invocation: SemanticInvocation,
  positionalEvidence: InvocationPositionalEvidenceInput,
): InvocationSemanticJudgment => {
  const input: InvocationSemanticInput = { knowledge, invocation, positionalEvidence };
  const targetResolution = invocationSemanticAlgebra.deriveTargetResolution(input);
  const argumentBinding = invocationSemanticAlgebra.deriveArgumentBinding({
    knowledge,
    invocation,
    targetResolution,
    positionalEvidence,
  });
  const effectProjection = invocationSemanticAlgebra.deriveEffectProjection({ knowledge, invocation, targetResolution });
  const obligations = allObligations(input, targetResolution, argumentBinding);
  const witnesses = witnessesForPhases(
    invocation,
    invocationPresent(knowledge, invocation),
    targetResolution,
    argumentBinding,
    effectProjection,
  );
  const derivation: InvocationSemanticDerivationWitnesses = Object.freeze({
    kind: 'invocation_semantic_derivation',
    status: obligations.length === 0 ? 'closed' : 'incomplete',
    witnesses,
  });
  const ruleTrace = traceForPhases(invocation, targetResolution, argumentBinding, effectProjection, obligations, witnesses);
  const closureEvidence = evidence(invocation.source, ...targetResolution.evidence, ...argumentBinding.evidence, ...effectProjection.evidence);
  return invocationSemanticAlgebra.closeJudgment({
    invocation,
    targetResolution,
    argumentBinding,
    effectProjection,
    obligations,
    evidence: closureEvidence,
    ruleTrace,
    derivation,
  });
};

export const analyzeInvocationSemanticAlgebra = (knowledge: SemanticKnowledgeDataFlow): InvocationSemanticAnalysis => {
  const judgments = Object.freeze(invocationsFrom(knowledge).map(invocation => deriveInvocationJudgment(
    knowledge, invocation, invocationPositionalEvidenceUnproven(invocation),
  )));
  const callTargets: readonly SemanticCallTarget[] = Object.freeze(judgments.flatMap(judgment =>
    judgment.targetResolution.kind === 'resolved' ? [Object.freeze({ invocation: judgment.invocation, callable: judgment.targetResolution.target })] : [],
  ));
  const argumentBindings = Object.freeze(judgments.map(judgment => judgment.argumentBinding));
  const resultFlows: readonly InvocationResultEmissionFlow[] = Object.freeze(judgments.flatMap(judgment => judgment.resultFlows));
  const exceptionFlows: readonly InvocationExceptionEmissionFlow[] = Object.freeze(judgments.flatMap(judgment => judgment.exceptionFlows));
  const unresolvedObligations = Object.freeze(judgments.flatMap(judgment => judgment.unresolvedObligations));
  const status = judgments.every(judgment => judgment.status === 'closed') ? 'closed' : 'incomplete';
  const ruleTrace = Object.freeze(judgments.flatMap(judgment => judgment.proof.ruleTrace));
  const witnesses = Object.freeze(judgments.flatMap(judgment => judgment.proof.derivation.witnesses));
  const proofEvidence = uniqueSources(judgments.flatMap(judgment => judgment.proof.evidence));
  const derivationProof: InvocationSemanticDerivationWitnesses = Object.freeze({ kind: 'invocation_semantic_derivation', status, witnesses });

  if (status === 'closed') {
    const closedJudgments = judgments.filter((judgment): judgment is Extract<InvocationSemanticJudgment, { readonly status: 'closed' }> => judgment.status === 'closed');
    const closedProof: Extract<InvocationSemanticProof, { readonly status: 'closed' }> = Object.freeze({ kind: 'invocation_semantic_proof', status: 'closed', closure: 'all-obligations-discharged', evidence: proofEvidence, ruleTrace, unresolvedObligations: emptyObligations, derivation: derivationProof });
    return Object.freeze({
    kind: 'invocation_semantic_analysis', status,
    judgments: closedJudgments,
    callTargets, argumentBindings, resultFlows, exceptionFlows,
    unresolvedObligations: emptyObligations,
    proof: closedProof,
    derivationProof,
  });
  }
  const incompleteProof: Extract<InvocationSemanticProof, { readonly status: 'incomplete' }> = Object.freeze({ kind: 'invocation_semantic_proof', status: 'incomplete', closure: unresolvedObligations.some(obligation => obligation.kind === 'invocation_evidence_missing') ? 'missing-invocation-evidence' : 'unresolved-obligations', evidence: proofEvidence, ruleTrace, unresolvedObligations, derivation: derivationProof });
  return Object.freeze({
    kind: 'invocation_semantic_analysis', status, judgments, callTargets, argumentBindings, resultFlows, exceptionFlows,
    unresolvedObligations, proof: incompleteProof, derivationProof,
  });
};

export const analyzeInvocationJudgmentAlgebra = (
  knowledge: SemanticKnowledgeDataFlow,
  requestedInvocation: SemanticInvocation,
  positionalEvidence: InvocationPositionalEvidenceInput,
): InvocationSemanticJudgment => deriveInvocationJudgment(knowledge, requestedInvocation, positionalEvidence);

export const callTargetForInvocation = (
  analysis: InvocationSemanticAnalysis,
  invocation: KnowledgeId,
): readonly SemanticCallable[] => Object.freeze(analysis.callTargets
  .filter(target => key(target.invocation.id) === key(invocation))
  .map(target => target.callable));

export const parameterFlowsForInvocation = (
  analysis: InvocationSemanticAnalysis,
  invocation: KnowledgeId,
): readonly SemanticArgumentParameterFlow[] => Object.freeze(analysis.judgments
  .filter(judgment => key(judgment.invocation.id) === key(invocation))
  .flatMap(judgment => judgment.argumentBinding.kind === 'established' || judgment.argumentBinding.kind === 'incomplete'
    ? judgment.argumentBinding.argumentDispositions.flatMap(disposition => disposition.kind === 'bound-argument' ? [disposition.relation] : [])
    : []));

export const invocationSemanticAlgebraHelpers = Object.freeze({ witnessInvocationId });

import { describe, expect, it } from 'vitest';
import {
  knowledgeId,
  semanticAbsent,
  semanticOperation,
  semanticSource,
  type KnowledgeId,
  type SemanticCallable,
  type SemanticEmission,
  type SemanticFlowGuard,
  type SemanticIdentifier,
  type SemanticInvocation,
  type SemanticKnowledgeDataFlow,
} from '../semanticDataflowKnowledge';
import { invocationSemanticAuthority } from '../invocationSemanticJudgmentAuthority';
import { invocationSemanticKnowledgeAlgebraOperations } from '../invocationSemanticJudgmentAlgebra';
import type { InvocationPositionalArgumentEvidence } from '../invocationSemanticJudgmentInterface';

const invocation = (argumentsList: readonly KnowledgeId[], slot: string): SemanticInvocation => {
  const source = semanticSource.create('phase1677.php', 1, 10);
  return Object.freeze({
    id: knowledgeId(source, 'invocation', slot),
    receiver: semanticAbsent<KnowledgeId>('not_applicable'),
    operation: semanticOperation.create('work'),
    arguments: argumentsList,
    source,
  });
};

const callable = (
  slot: string,
  parameters: readonly KnowledgeId[] = [],
  emissions: readonly KnowledgeId[] = [],
): SemanticCallable => {
  const source = semanticSource.create('phase1677.php', 20, 40);
  return Object.freeze({
    id: knowledgeId(source, 'callable', slot),
    name: semanticAbsent<SemanticIdentifier>('not_provided'),
    parameters,
    body: semanticAbsent<KnowledgeId>('not_provided'),
    emissions,
    source,
  });
};

const knowledge = (
  subject: SemanticInvocation,
  targets: readonly SemanticCallable[],
  effects: readonly SemanticEmission[] = [],
): SemanticKnowledgeDataFlow => Object.freeze({
  modRefFacts: [],
  modRefRelations: [],
  facts: Object.freeze([
    { kind: 'invocation' as const, value: subject },
    ...targets.map(value => ({ kind: 'callable' as const, value })),
    ...effects.map(value => ({ kind: 'emission' as const, value })),
  ]),
  dataFlow: Object.freeze(targets.map(target => Object.freeze({
    kind: 'dependency' as const,
    source: subject.id,
    target: target.id,
    role: Object.freeze({ code: 'callable' as const }),
    guard: semanticAbsent<SemanticFlowGuard>('not_applicable'),
  }))),
  relations: Object.freeze([]),
});

const positionalEvidence = (
  subject: SemanticInvocation,
  normalizedArguments: readonly KnowledgeId[],
): InvocationPositionalArgumentEvidence => Object.freeze({
  kind: 'invocation_positional_argument_evidence',
  invocation: subject.id,
  normalizedArguments,
  normalization: 'upstream-confirmed-positional-arguments',
  source: semanticSource.create('phase1677.php', 10, 13),
});

describe('invocation semantic algebra phase 1677', () => {
  it('projects result and exception effects as separate flows for a resolved target', () => {
    const subject = invocation([], 'no-arguments');
    const resultSource = semanticSource.create('phase1677.php', 41, 45);
    const exceptionSource = semanticSource.create('phase1677.php', 46, 50);
    const resultId = knowledgeId(resultSource, 'emission', 'result');
    const exceptionId = knowledgeId(exceptionSource, 'emission', 'exception');
    const result: SemanticEmission = Object.freeze({ id: resultId, definition: { code: 'result' as const }, value: semanticAbsent<KnowledgeId>('void_emission'), source: resultSource });
    const exception: SemanticEmission = Object.freeze({ id: exceptionId, definition: { code: 'exception' as const }, value: semanticAbsent<KnowledgeId>('not_provided'), source: exceptionSource });
    const resultJudgment = invocationSemanticAuthority.analyze({ knowledge: knowledge(subject, [callable('target', [], [resultId, exceptionId])], [result, exception]), invocation: subject, positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(subject) });

    expect(resultJudgment.status).toBe('closed');
    expect(resultJudgment.targetResolution.kind).toBe('resolved');
    expect(resultJudgment.argumentBinding.kind).toBe('not-required');
    expect(resultJudgment.resultFlows.map(flow => flow.kind)).toEqual(['result-emission-flow']);
    expect(resultJudgment.exceptionFlows.map(flow => flow.kind)).toEqual(['exception-emission-flow']);
  });

  it('rejects a requested invocation that reuses a knowledge identity with altered semantic shape', () => {
    const argument = knowledgeId(semanticSource.create('phase1677.php', 11, 12), 'value', 'shape-argument');
    const subject = invocation([argument], 'same-identity-shape');
    const model = knowledge(subject, [callable('target', [knowledgeId(semanticSource.create('phase1677.php', 21, 22), 'variable', 'parameter')])]);
    const altered = Object.freeze({ ...subject, arguments: Object.freeze([]) });

    expect(() => invocationSemanticAuthority.analyze({
      knowledge: model,
      invocation: altered,
      positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(altered),
    })).toThrow(/reuses a knowledge identity with different receiver, operation, ordered arguments, or source provenance/);
  });

  it('rejects an unproven-evidence obligation whose invocation shape differs despite sharing identity', () => {
    const argument = knowledgeId(semanticSource.create('phase1677.php', 11, 12), 'value', 'obligation-argument');
    const subject = invocation([argument], 'same-obligation-identity');
    const altered = Object.freeze({ ...subject, arguments: Object.freeze([]) });
    const model = knowledge(subject, [callable('target')]);

    expect(() => invocationSemanticAuthority.analyze({
      knowledge: model,
      invocation: subject,
      positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(altered),
    })).toThrow(/obligation does not preserve the exact requested invocation/);
  });

  it('does not infer positional binding from argument array order alone', () => {
    const argument = knowledgeId(semanticSource.create('phase1677.php', 11, 12), 'value', 'argument');
    const parameter = knowledgeId(semanticSource.create('phase1677.php', 21, 22), 'variable', 'parameter');
    const subject = invocation([argument], 'unproven-argument-form');
    const result = invocationSemanticAuthority.analyze({ knowledge: knowledge(subject, [callable('target', [parameter])]), invocation: subject, positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(subject) });

    expect(result.status).toBe('incomplete');
    expect(result.argumentBinding.kind).toBe('argument-form-unproven');
    expect(result.unresolvedObligations.map(obligation => obligation.kind)).toContain('argument_form_unproven');
  });

  it('accepts only evidence matching the exact invocation and ordered arguments', () => {
    const argument = knowledgeId(semanticSource.create('phase1677.php', 11, 12), 'value', 'argument');
    const parameter = knowledgeId(semanticSource.create('phase1677.php', 21, 22), 'variable', 'parameter');
    const subject = invocation([argument], 'proven-argument-form');
    const model = knowledge(subject, [callable('target', [parameter])]);
    const result = invocationSemanticAuthority.analyze({ knowledge: model, invocation: subject, positionalEvidence: { kind: 'positional-evidence-established', evidence: positionalEvidence(subject, [argument]) } });
    const foreign = invocation([argument], 'foreign-invocation');
    const rejected = invocationSemanticAuthority.analyze({ knowledge: model, invocation: subject, positionalEvidence: { kind: 'positional-evidence-established', evidence: positionalEvidence(foreign, [argument]) } });

    expect(result.status).toBe('closed');
    expect(result.argumentBinding.kind).toBe('established');
    expect(rejected.status).toBe('incomplete');
    expect(rejected.argumentBinding.kind).toBe('argument-form-unproven');
  });

  it('preserves repeated argument identities as distinct ordered parameter bindings', () => {
    const argument = knowledgeId(semanticSource.create('phase1677.php', 11, 12), 'value', 'repeated-argument');
    const firstParameter = knowledgeId(semanticSource.create('phase1677.php', 21, 22), 'variable', 'first-parameter');
    const secondParameter = knowledgeId(semanticSource.create('phase1677.php', 23, 24), 'variable', 'second-parameter');
    const subject = invocation([argument, argument], 'repeated-argument-call');
    const result = invocationSemanticAuthority.analyze({
      knowledge: knowledge(subject, [callable('target', [firstParameter, secondParameter])]),
      invocation: subject,
      positionalEvidence: { kind: 'positional-evidence-established', evidence: positionalEvidence(subject, [argument, argument]) },
    });

    expect(result.status).toBe('closed');
    expect(result.argumentBinding.kind).toBe('established');
    if (result.argumentBinding.kind !== 'established') throw new Error('Expected established argument binding');
    expect(result.argumentBinding.argumentDispositions).toHaveLength(2);
    expect(result.argumentBinding.argumentDispositions[0]?.relation.parameter).toEqual(firstParameter);
    expect(result.argumentBinding.argumentDispositions[1]?.relation.parameter).toEqual(secondParameter);
  });

  it('retains an explicit obligation when the requested invocation is absent from knowledge', () => {
    const requested = invocation([], 'absent-request');
    const model = knowledge(invocation([], 'different-request'), []);
    const result = invocationSemanticAuthority.analyze({ knowledge: model, invocation: requested, positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(requested) });

    expect(result.status).toBe('incomplete');
    expect(result.unresolvedObligations.map(obligation => obligation.kind)).toContain('invocation_evidence_missing');
  });

  it('retains unresolved and ambiguous target outcomes without projecting effects', () => {
    const unresolvedSubject = invocation([], 'unresolved-target');
    const unresolved = invocationSemanticAuthority.analyze({ knowledge: knowledge(unresolvedSubject, []), invocation: unresolvedSubject, positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(unresolvedSubject) });
    const ambiguousSubject = invocation([], 'ambiguous-target');
    const ambiguous = invocationSemanticAuthority.analyze({
      knowledge: knowledge(ambiguousSubject, [callable('candidate-a'), callable('candidate-b')]),
      invocation: ambiguousSubject,
      positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(ambiguousSubject),
    });

    expect(unresolved.targetResolution.kind).toBe('unresolved');
    expect(unresolved.argumentBinding.kind).toBe('blocked');
    expect(unresolved.resultFlows).toHaveLength(0);
    expect(ambiguous.targetResolution.kind).toBe('ambiguous');
    if (ambiguous.targetResolution.kind !== 'ambiguous') throw new Error('Expected ambiguous target resolution');
    expect(ambiguous.targetResolution.candidates).toHaveLength(2);
    expect(ambiguous.argumentBinding.kind).toBe('blocked');
    expect(ambiguous.resultFlows).toHaveLength(0);
  });
});

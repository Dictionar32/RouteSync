import { invocationSemanticKnowledgeAlgebraOperations } from '../../../../types/upstream/invocationSemanticJudgmentAlgebra';
import { describe, expect, it } from 'vitest';
import {
  semanticInterproceduralDataFlowAuthority,
  invocationSemanticAuthority,
  invocationSemanticKnowledgeAlgebraOperations,
  INVOCATION_SEMANTIC_CONTRACT,
  invocationSemanticRuntimeExecutor,
} from './semanticInterproceduralDataFlowRelations';
import {
  knowledgeId,
  semanticFact,
  semanticSource,
  semanticIdentifier,
  semanticOperation,
  semanticPresent,
  semanticAbsent,
  semanticDependency,
  type SemanticKnowledgeDataFlow,
  type SemanticIdentifier,
  type SemanticLiteral,
} from './semanticKnowledgeDataFlowRelations';

const source = semanticSource.create('phase219.php', 0, 1);
const id = (role: Parameters<typeof knowledgeId>[1], slot: string) => knowledgeId(source, role, slot);

const variable = (slot: string) => ({
  kind: 'variable' as const,
  value: {
    id: id('variable', slot),
    name: semanticIdentifier.create(slot),
    scope: id('scope', 'root'),
    source,
  },
});

const scope = {
  kind: 'scope' as const,
  value: { id: id('scope', 'root'), source: semanticPresent(source) },
};

const value = (slot: string) => ({
  kind: 'value' as const,
  value: {
    id: id('value', slot),
    kind: { code: 'literal' as const },
    name: semanticAbsent<SemanticIdentifier>('not_applicable'),
    value: semanticAbsent<SemanticLiteral>('not_provided'),
    source,
  },
});

describe('Phase 219 — interprocedural semantic data-flow', () => {
  it('binds invocation arguments to callable parameters and emits result/exception flow', () => {
    const parameter = id('variable', 'parameter');
    const body = id('scope', 'body');
    const invocation = id('invocation', 'call');
    const callable = id('callable', 'callee');
    const argument = id('value', 'argument');
    const result = id('emission', 'result');
    const exception = id('emission', 'exception');

    const model: SemanticKnowledgeDataFlow = {
  modRefFacts: [],
  modRefRelations: [],
      facts: [
        scope,
        variable('parameter'),
        value('argument'),
        semanticFact({ kind: 'scope', value: { id: body, source: semanticPresent(source) } }),
        semanticFact({
          kind: 'invocation',
          value: {
            id: invocation,
            receiver: semanticAbsent('not_applicable'),
            operation: semanticOperation.create('work'),
            arguments: [argument],
            source,
          },
        }),
        semanticFact({
          kind: 'callable',
          value: {
            id: callable,
            name: semanticPresent(semanticIdentifier.create('work')),
            parameters: [parameter],
            body: semanticPresent(body),
            emissions: [result, exception],
            source,
          },
        }),
        semanticFact({
          kind: 'emission',
          value: { id: result, definition: { code: 'result' }, value: semanticPresent(argument), source },
        }),
        semanticFact({
          kind: 'emission',
          value: { id: exception, definition: { code: 'exception' }, value: semanticAbsent('void_emission'), source },
        }),
      ],
      dataFlow: [semanticDependency.create(invocation, callable, 'callable')],
      relations: [],
    };

    const analysis = semanticInterproceduralDataFlowAuthority.analyze(model);
    if (analysis.status !== 'closed') throw new Error('Interprocedural analysis must expose an incomplete judgment instead of a partial projection.');
    expect(analysis.kind).toBe('invocation_semantic_analysis');
    expect(INVOCATION_SEMANTIC_CONTRACT.kind).toBe('invocation_semantic_contract');
    expect(INVOCATION_SEMANTIC_CONTRACT.version).toBe(19);
    expect(INVOCATION_SEMANTIC_CONTRACT.meaning.identity.targetCardinality).toBe('exactly-one-distinct-target-for-closure');
    expect(INVOCATION_SEMANTIC_CONTRACT.meaning.argumentBinding.correspondence).toBe('invocation-argument-index-to-callable-parameter-index');
    expect(INVOCATION_SEMANTIC_CONTRACT.meaning.closure.partialEvidenceAlone).toBe('insufficient');
    expect(INVOCATION_SEMANTIC_CONTRACT.rules.map(rule => rule.id)).toEqual([
      'invocation-evidence-presence',
      'invocation-target-resolution',
      'invocation-target-ambiguity',
      'invocation-positional-argument-binding',
      'invocation-argument-parameter-unresolved',
      'invocation-result-emission',
      'invocation-exception-emission',
      'invocation-unresolved-target-obligation',
      'invocation-judgment-closure',
    ]);
    expect(analysis.proof.ruleTrace.some(entry => entry.ruleId === 'invocation-judgment-closure' && entry.outcome === 'closed')).toBe(true);
    expect(analysis.judgments).toHaveLength(1);
    expect(analysis.judgments[0]?.kind).toBe('invocation_semantic_judgment');
    expect(analysis.judgments[0]?.status).toBe('closed');
    const judgment = invocationSemanticAuthority.analyze({
      knowledge: model,
      invocation: analysis.judgments[0]!.invocation,
      positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(analysis.judgments[0]!.invocation),
    });
    expect(invocationSemanticAuthority.kind).toBe('invocation_semantic_authority');
    expect(invocationSemanticAuthority.contract).toBe(INVOCATION_SEMANTIC_CONTRACT);
    expect(invocationSemanticRuntimeExecutor.contract).toBe(INVOCATION_SEMANTIC_CONTRACT);
    expect(invocationSemanticRuntimeExecutor.executeAll(model)).toEqual(analysis);
    expect(invocationSemanticRuntimeExecutor.execute({
      knowledge: model,
      invocation: analysis.judgments[0]!.invocation,
      positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(analysis.judgments[0]!.invocation),
    })).toEqual(judgment);
    expect(judgment.kind).toBe('invocation_semantic_judgment');
    expect(judgment.status).toBe('closed');
    expect(judgment.invocation.id).toEqual(invocation);
    expect(invocationSemanticKnowledgeAlgebraOperations.callTargetsFor(analysis, invocation)).toHaveLength(1);
    expect(invocationSemanticKnowledgeAlgebraOperations.parameterFlowsFor(analysis, invocation)).toHaveLength(1);
    expect(invocationSemanticKnowledgeAlgebraOperations.parameterFlowsFor(analysis, invocation)[0].parameter).toEqual(parameter);
    expect(invocationSemanticKnowledgeAlgebraOperations.parameterFlowsFor(analysis, invocation)[0].argument).toEqual(argument);
    expect(analysis.resultFlows).toHaveLength(1);
    expect(analysis.exceptionFlows).toHaveLength(1);
    expect(analysis.resultFlows[0].target).toEqual(invocation);
  });

  it('preserves known invocation facts while reporting arguments without a parameter as incomplete', () => {
    const invocation = id('invocation', 'partial-call');
    const callable = id('callable', 'one-parameter-callee');
    const firstArgument = id('value', 'first-argument');
    const secondArgument = id('value', 'second-argument');
    const parameter = id('variable', 'only-parameter');
    const body = id('scope', 'partial-body');

    const model: SemanticKnowledgeDataFlow = {
  modRefFacts: [],
  modRefRelations: [],
      facts: [
        scope,
        value('first-argument'),
        value('second-argument'),
        variable('only-parameter'),
        semanticFact({ kind: 'scope', value: { id: body, source: semanticPresent(source) } }),
        semanticFact({
          kind: 'invocation',
          value: {
            id: invocation,
            receiver: semanticAbsent('not_applicable'),
            operation: semanticOperation.create('work'),
            arguments: [firstArgument, secondArgument],
            source,
          },
        }),
        semanticFact({
          kind: 'callable',
          value: {
            id: callable,
            name: semanticPresent(semanticIdentifier.create('work')),
            parameters: [parameter],
            body: semanticPresent(body),
            emissions: [],
            source,
          },
        }),
      ],
      dataFlow: [semanticDependency.create(invocation, callable, 'callable')],
      relations: [],
    };

    const analysis = semanticInterproceduralDataFlowAuthority.analyze(model);
    expect(analysis.status).toBe('incomplete');
    if (analysis.status !== 'incomplete') throw new Error('Missing parameter must remain an explicit semantic obligation.');
    expect(analysis.callTargets).toHaveLength(1);
    expect(analysis.argumentParameters).toHaveLength(1);
    expect(analysis.unresolvedObligations).toHaveLength(1);
    expect(analysis.unresolvedObligations[0]).toMatchObject({
      kind: 'argument_parameter_unresolved',
      reason: 'argument_without_parameter',
      invocation,
      callable: expect.objectContaining({ id: callable }),
      argument: secondArgument,
    });
    // The domain derivation remains incomplete while an argument-binding obligation is unresolved.
    expect(analysis.derivationProof.status).toBe('incomplete');
    expect(analysis.proof.status).toBe('incomplete');
    expect(analysis.proof.ruleTrace.some(entry => entry.ruleId === 'invocation-positional-argument-binding' && entry.obligationCount === 1)).toBe(true);
    expect(analysis.proof.ruleTrace.some(entry => entry.ruleId === 'invocation-judgment-closure' && entry.outcome === 'incomplete')).toBe(true);
    expect(analysis.judgments[0]?.status).toBe('incomplete');
  });



  it('keeps multiple callable candidates incomplete until target ambiguity is explicitly resolved', () => {
    const invocation = id('invocation', 'ambiguous-call');
    const callableA = id('callable', 'candidate-a');
    const callableB = id('callable', 'candidate-b');
    const bodyA = id('scope', 'candidate-a-body');
    const bodyB = id('scope', 'candidate-b-body');
    const callableFact = (callableId: typeof callableA, body: typeof bodyA, name: string) => semanticFact({
      kind: 'callable',
      value: {
        id: callableId,
        name: semanticPresent(semanticIdentifier.create(name)),
        parameters: [],
        body: semanticPresent(body),
        emissions: [],
        source,
      },
    });
    const model: SemanticKnowledgeDataFlow = {
  modRefFacts: [],
  modRefRelations: [],
      facts: [
        scope,
        semanticFact({
          kind: 'invocation',
          value: {
            id: invocation,
            receiver: semanticAbsent('not_applicable'),
            operation: semanticOperation.create('work'),
            arguments: [],
            source,
          },
        }),
        callableFact(callableA, bodyA, 'candidateA'),
        callableFact(callableB, bodyB, 'candidateB'),
      ],
      // A duplicate witness for candidate A must not count as a third candidate.
      dataFlow: [
        semanticDependency.create(invocation, callableA, 'callable'),
        semanticDependency.create(invocation, callableA, 'callable'),
        semanticDependency.create(invocation, callableB, 'callable'),
      ],
      relations: [],
    };

    const batch = semanticInterproceduralDataFlowAuthority.analyze(model);
    expect(batch.status).toBe('incomplete');
    if (batch.status !== 'incomplete') throw new Error('Ambiguous target candidates must not close without explicit resolution.');
    expect(batch.callTargets).toHaveLength(2);
    expect(batch.unresolvedObligations).toContainEqual(expect.objectContaining({
      kind: 'callable_target_ambiguous',
      reason: 'multiple_distinct_resolved_callable_targets',
      invocation: expect.objectContaining({ id: invocation }),
      candidateCallables: expect.arrayContaining([
        expect.objectContaining({ id: callableA }),
        expect.objectContaining({ id: callableB }),
      ]),
    }));
    const ambiguityTrace = batch.proof.ruleTrace.find(entry => entry.ruleId === 'invocation-target-ambiguity');
    expect(ambiguityTrace).toEqual(expect.objectContaining({
      subjectInvocation: invocation,
      outcome: 'obligation-emitted',
      obligationCount: 1,
      obligations: [expect.objectContaining({ kind: 'callable_target_ambiguous' })],
    }));
    expect(ambiguityTrace?.evidence).toEqual(expect.arrayContaining([source]));
    const targetResolutionTrace = batch.proof.ruleTrace.find(entry => entry.ruleId === 'invocation-target-resolution');
    expect(targetResolutionTrace?.obligations).toEqual([]);
    expect(targetResolutionTrace?.obligationCount).toBe(targetResolutionTrace?.obligations.length);
    expect(targetResolutionTrace?.witnesses).toHaveLength(1);
    expect(targetResolutionTrace?.witnesses[0]).toEqual(expect.objectContaining({
      kind: 'target-resolution',
      outcome: 'ambiguous',
      targets: expect.arrayContaining([
        expect.objectContaining({ callable: expect.objectContaining({ id: callableA }) }),
        expect.objectContaining({ callable: expect.objectContaining({ id: callableB }) }),
      ]),
    }));
    expect(targetResolutionTrace?.witnesses[0]?.evidence.length).toBeGreaterThan(0);
    expect(ambiguityTrace?.obligationCount).toBe(ambiguityTrace?.obligations.length);

    const single = invocationSemanticAuthority.analyze({ knowledge: model, invocation: batch.judgments[0]!.invocation, positionalEvidence: invocationSemanticKnowledgeAlgebraOperations.unprovenPositionalEvidenceFor(batch.judgments[0]!.invocation) });
    expect(single.status).toBe('incomplete');
    expect(single.unresolvedObligations.some(obligation => obligation.kind === 'callable_target_ambiguous')).toBe(true);
  });

  it('reports an unresolved invocation target instead of treating missing evidence as a closed empty result', () => {
    const invocation = id('invocation', 'unresolved-call');
    const model: SemanticKnowledgeDataFlow = {
  modRefFacts: [],
  modRefRelations: [],
      facts: [
        scope,
        semanticFact({
          kind: 'invocation',
          value: {
            id: invocation,
            receiver: semanticAbsent('not_applicable'),
            operation: semanticOperation.create('unknown'),
            arguments: [],
            source,
          },
        }),
      ],
      dataFlow: [],
      relations: [],
    };

    const analysis = semanticInterproceduralDataFlowAuthority.analyze(model);
    expect(analysis.status).toBe('incomplete');
    expect(analysis.unresolvedObligations).toContainEqual({
      kind: 'callable_target_unresolved',
      reason: 'no_resolved_callable_target',
      invocation: expect.objectContaining({ id: invocation }),
    });
    expect(analysis.judgments[0]?.status).toBe('incomplete');
    const unresolvedTrace = analysis.proof.ruleTrace.find(entry => entry.ruleId === 'invocation-unresolved-target-obligation');
    expect(unresolvedTrace?.obligations).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'callable_target_unresolved' })]));
    expect(unresolvedTrace?.obligationCount).toBe(unresolvedTrace?.obligations.length);
    const targetResolutionTrace = analysis.proof.ruleTrace.find(entry => entry.ruleId === 'invocation-target-resolution');
    expect(targetResolutionTrace?.obligations).toEqual([]);
  });

});

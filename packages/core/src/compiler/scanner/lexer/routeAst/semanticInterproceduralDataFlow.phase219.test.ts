import { describe, expect, it } from 'vitest';
import {
  analyzeSemanticInterproceduralDataFlow,
  callTargetFor,
  parameterFlowsFor,
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
} from './semanticKnowledgeDataFlowRelations';

const source = semanticSource('phase219.php', 0, 1);
const id = (role: Parameters<typeof knowledgeId>[1], slot: string) => knowledgeId(source, role, slot);

const variable = (slot: string) => ({
  kind: 'variable' as const,
  value: {
    id: id('variable', slot),
    name: semanticIdentifier(slot),
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
    name: semanticAbsent('not_applicable'),
    value: semanticAbsent('not_provided'),
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
            operation: semanticOperation('work'),
            arguments: [argument],
            source,
          },
        }),
        semanticFact({
          kind: 'callable',
          value: {
            id: callable,
            name: semanticPresent(semanticIdentifier('work')),
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
      dataFlow: [semanticDependency(invocation, callable, 'callable')],
      relations: [],
    };

    const analysis = analyzeSemanticInterproceduralDataFlow(model);
    expect(callTargetFor(analysis, invocation)).toHaveLength(1);
    expect(parameterFlowsFor(analysis, invocation)).toHaveLength(1);
    expect(parameterFlowsFor(analysis, invocation)[0].parameter).toEqual(parameter);
    expect(parameterFlowsFor(analysis, invocation)[0].argument).toEqual(argument);
    expect(analysis.resultFlows).toHaveLength(1);
    expect(analysis.exceptionFlows).toHaveLength(1);
    expect(analysis.resultFlows[0].target).toEqual(invocation);
  });
});

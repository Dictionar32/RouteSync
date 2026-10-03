import { describe, expect, it } from 'vitest';
import { classifyPhpBlock } from '../astClassifier';
import { tokenizePhpSource } from '../tokenizer';
import { produceSemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowProducer';

const parse = (source: string) => classifyPhpBlock(
  tokenizePhpSource(source).filter(token => token.type !== 'EOF'),
);

describe('semantic Knowledge/Data-Flow source of truth', () => {
  it('raises strict comparison into typed semantic knowledge', () => {
    const graph = produceSemanticKnowledgeDataFlow(parse('if ($a === $b) { return $x; }'), '/project/Example.php');
    const operator = graph.facts.find(fact => fact.kind === 'operator');
    expect(operator?.kind).toBe('operator');
    if (operator?.kind === 'operator') expect(operator.value.definition.code).toBe('identical');
    expect(graph.facts.some(fact => fact.kind === 'comparison')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'predicate')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'choice')).toBe(true);
  });

  it('raises !== into distinct semantic operator meaning', () => {
    const graph = produceSemanticKnowledgeDataFlow(parse('while ($a !== null) { return $a; }'));
    const operator = graph.facts.find(fact => fact.kind === 'operator');
    expect(operator?.kind).toBe('operator');
    if (operator?.kind === 'operator') expect(operator.value.definition.code).toBe('not_identical');
    expect(graph.facts.some(fact => fact.kind === 'comparison')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'repetition')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'predicate')).toBe(true);
  });

  it('raises switch/match alternatives into choice, match, predicate and outcome data', () => {
    const graph = produceSemanticKnowledgeDataFlow(parse('switch ($x) { case 1: return $a; default: return $b; }'));
    expect(graph.facts.some(fact => fact.kind === 'choice')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'match')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'predicate')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'outcome')).toBe(true);
  });

  it('keeps canonical flow limited to semantic dependency/value flow', () => {
    const graph = produceSemanticKnowledgeDataFlow(parse('if ($a === $b) { $x = foo($a); }'));
    expect(graph.dataFlow.every(flow => flow.kind === 'dependency' || flow.kind === 'value-flow')).toBe(true);
    expect(graph.dataFlow.every(flow => !['successor', 'predecessor', 'reenters', 'branches_to', 'executes'].includes(flow.role.code))).toBe(true);
    expect(graph.relations.every(edge => edge.relation.code === 'depends_on' || edge.relation.code === 'flows_to')).toBe(true);
  });

  it('does not use syntax-shaped knowledge identity roles', () => {
    const graph = produceSemanticKnowledgeDataFlow(parse('if ($a === $b) { return $x; }'));
    const roles = graph.facts.map(fact => fact.value.id.identity.role);
    expect(roles).not.toContain('statement');
    expect(roles).not.toContain('expression');
    expect(roles).not.toContain('assignment-target');
  });
});

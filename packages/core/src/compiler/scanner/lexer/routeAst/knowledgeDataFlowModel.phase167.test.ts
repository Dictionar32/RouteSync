import { describe, expect, it } from 'vitest';
import { classifyPhpBlock } from '../astClassifier';
import { tokenizePhpSource } from '../tokenizer';
import { produceSemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowProducer';
import {
  SEMANTIC_OPERATOR_KNOWLEDGE,
  SEMANTIC_RELATION_KNOWLEDGE,
    SEMANTIC_EMISSION_KNOWLEDGE,
  knowledgeIdKey,
  SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE,
} from './semanticKnowledgeDataFlowRelations';

describe('Phase 180 semantic ontology is not parser statement ontology', () => {
  it('uses semantic choice/repetition facts instead of statement-shaped fact kinds', () => {
    const source = 'if ($a === $b) { $x = 1; } switch ($x) { case 1: $x = 2; } while ($x) { $x--; }';
    const block = classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const kinds = graph.facts.map(fact => fact.kind);

    expect(kinds).toContain('choice');
    expect(kinds).toContain('repetition');
    expect(kinds).not.toContain('decision');
    expect(kinds).not.toContain('selection');
    expect(kinds).not.toContain('iteration');
  });

  it('represents repetition by semantic participation rather than loop syntax', () => {
    const block = classifyPhpBlock(tokenizePhpSource('foreach ($items as $item) { $value = $item; }').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const repetition = graph.facts.find(fact => fact.kind === 'repetition');

    expect(repetition?.kind).toBe('repetition');
    if (repetition?.kind === 'repetition') {
      expect(repetition.value.iterable.kind).toBe('present');
      expect(repetition.value.binding.kind).toBe('present');
      expect(repetition.value.body.kind).toBe('knowledge-id');
    }
    expect(graph.dataFlow.some(flow => flow.role.code === 'iterable')).toBe(true);
    expect(graph.dataFlow.some(flow => flow.role.code === 'binding')).toBe(true);
  });
});

describe('Phase 167 semantic vocabulary is data', () => {
  it('represents operator meaning as a typed definition, not a raw semantic string', () => {
    const block = classifyPhpBlock(tokenizePhpSource('return $a === $b;').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const operator = graph.facts.find(fact => fact.kind === 'operator');

    expect(operator?.kind).toBe('operator');
    expect(operator?.value.definition.code).toBe('identical');
    expect(operator?.value.definition.category.code).toBe('comparison');
  });

  it('raises unary operator applications into typed knowledge too', () => {
    const block = classifyPhpBlock(tokenizePhpSource('return !$ready;').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const operation = graph.facts.find(fact => fact.kind === 'unary-operation');
    const operator = graph.facts.find(fact => fact.kind === 'operator' && fact.value.definition.code === 'not');

    expect(operation?.kind).toBe('unary-operation');
    expect(operator?.kind).toBe('operator');
    if (operation?.kind === 'unary-operation') {
      expect(operation.value.operator.kind).toBe('knowledge-id');
      expect(operation.value.operand.kind).toBe('knowledge-id');
    }
    expect(graph.relations.some(edge => edge.relation.code === 'flows_to')).toBe(false);
  });

  it('raises non-comparison operator applications into typed knowledge too', () => {
    const block = classifyPhpBlock(tokenizePhpSource('return $a + $b && $c;').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const operations = graph.facts.filter(fact => fact.kind === 'binary-operation');
    const operators = graph.facts.filter(fact => fact.kind === 'operator');

    expect(operations.length).toBe(2);
    expect(operators.some(fact => fact.kind === 'operator' && fact.value.definition.code === 'addition')).toBe(true);
    expect(operators.some(fact => fact.kind === 'operator' && fact.value.definition.code === 'logical_and')).toBe(true);
    expect(graph.relations.filter(edge => edge.relation.code === 'depends_on').length).toBeGreaterThanOrEqual(4);
  });

  it('materializes decision outcomes as facts instead of branch control-flow labels', () => {
    const block = classifyPhpBlock(tokenizePhpSource('if ($a === $b) { return $x; } else { return $y; }').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const outcomes = graph.facts.filter(fact => fact.kind === 'outcome');

    expect(outcomes.length).toBeGreaterThanOrEqual(2);
    expect(outcomes.some(fact => fact.kind === 'outcome' && fact.value.role.code === 'satisfied')).toBe(true);
    expect(outcomes.some(fact => fact.kind === 'outcome' && fact.value.role.code === 'unsatisfied')).toBe(true);
    const decision = graph.facts.find(fact => fact.kind === 'choice');
    expect(decision?.kind).toBe('choice');
    if (decision?.kind === 'choice') {
      expect(decision.value.alternatives).toHaveLength(2);
      expect(decision.value.alternatives.every(alternative => alternative.predicates.length === 1)).toBe(true);
      expect(decision.value.alternatives.every(alternative => alternative.predicates[0] === decision.value.predicate.value)).toBe(true);
      expect(decision.value.alternatives.map(alternative => alternative.polarity)).toEqual(['satisfied', 'unsatisfied']);
    }
    expect(graph.relations.every(edge => edge.from !== edge.to)).toBe(true);
  });

  it('promotes variable identity into canonical knowledge instead of occurrence identity', () => {
    const block = classifyPhpBlock(tokenizePhpSource('$x = 1; $y = $x; $x === $y;').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const variables = graph.facts.filter(fact => fact.kind === 'variable');
    const references = graph.facts.filter(fact => fact.kind === 'reference');
    const xVariables = variables.filter(fact => fact.kind === 'variable' && fact.value.name.value === '$x');

    expect(xVariables).toHaveLength(1);
    expect(references.length).toBeGreaterThanOrEqual(1);
    expect(graph.dataFlow.some(flow => flow.role.code === 'value' && references.some(reference => reference.kind === 'reference' && knowledgeIdKey(reference.value.id) === knowledgeIdKey(flow.source)))).toBe(true);
  });

  it('keeps switch fall-through as choice semantics rather than a control-flow edge', () => {
    const block = classifyPhpBlock(tokenizePhpSource('switch ($x) { case 1: $a = 1; case 2: $b = 2; break; default: $c = 3; }').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const choice = graph.facts.find(fact => fact.kind === 'choice');

    expect(choice?.kind).toBe('choice');
    if (choice?.kind === 'choice') {
      expect(choice.value.selection.code).toBe('first_satisfied');
      expect(choice.value.alternatives[0]?.continuation.code).toBe('continue');
      expect(choice.value.alternatives[1]?.continuation.code).toBe('stop');
    }
    expect(graph.relations.every(edge => edge.relation.code === 'depends_on' || edge.relation.code === 'flows_to')).toBe(true);
  });

  it('keeps comparison meaning and alternative predicate references as canonical data', () => {
    const block = classifyPhpBlock(tokenizePhpSource('if ($a !== $b) { $x = 1; } else { $x = 2; }').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const comparison = graph.facts.find(fact => fact.kind === 'comparison');
    const choice = graph.facts.find(fact => fact.kind === 'choice');

    expect(comparison?.kind).toBe('comparison');
    if (comparison?.kind === 'comparison') {
      const operator = graph.facts.find(fact => fact.kind === 'operator' && knowledgeIdKey(fact.value.id) === knowledgeIdKey(comparison.value.operator));
      expect(operator?.kind).toBe('operator');
      if (operator?.kind === 'operator') expect(operator.value.definition.code).toBe('not_identical');
    }
    expect(choice?.kind).toBe('choice');
    if (choice?.kind === 'choice' && choice.value.predicate.kind === 'present') {
      expect(choice.value.alternatives.every(alternative => alternative.predicates.includes(choice.value.predicate.value))).toBe(true);
      expect(choice.value.alternatives.map(alternative => alternative.polarity)).toEqual(['satisfied', 'unsatisfied']);
    }
  });

  it('materializes switch/match alternatives and exception boundaries as data', () => {
    const source = 'try { switch ($x) { case 1: return $a; default: return $b; } } catch (Error $e) { return $c; } finally { $d = $e; }';
    const block = classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);

    expect(graph.facts.some(fact => fact.kind === 'choice')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'exception')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'outcome' && fact.value.role.code === 'default')).toBe(true);
    const selection = graph.facts.find(fact => fact.kind === 'choice');
    expect(selection?.kind).toBe('choice');
    if (selection?.kind === 'choice') expect(selection.value.alternatives.length).toBeGreaterThanOrEqual(2);
    const exception = graph.facts.find(fact => fact.kind === 'exception');
    expect(exception?.kind).toBe('exception');
    if (exception?.kind === 'exception') {
      expect(exception.value.catches.length).toBe(1);
      expect(exception.value.finallyBlock.kind).toBe('present');
    }
  });

  it('does not encode loop re-entry as a graph edge', () => {
    const block = classifyPhpBlock(tokenizePhpSource('while ($ready) { $value = 1; }').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);

    expect(graph.relations.some(edge => (edge.relation.code as string) === 'reenters')).toBe(false);
    expect(graph.relations.every(edge => ['depends_on', 'flows_to'].includes(edge.relation.code))).toBe(true);
    const iteration = graph.facts.find(fact => fact.kind === 'repetition');
    expect(iteration?.kind).toBe('repetition');
    if (iteration?.kind === 'repetition') {
      expect(iteration.value.body.kind).toBe('knowledge-id');
    }
  });

  it('keeps semantic catalogs as source data while indexes remain derived', () => {
    expect(SEMANTIC_OPERATOR_KNOWLEDGE.length).toBeGreaterThan(0);
    expect(SEMANTIC_RELATION_KNOWLEDGE.map(item => item.code)).toEqual([
      'depends_on', 'flows_to',
    ]);
    expect(SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.map(item => item.code)).not.toContain('condition');
    expect(SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.map(item => item.code)).toContain('binding');
    expect(SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.map(item => item.code)).toContain('candidate');
    expect(SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.map(item => item.code)).not.toContain('branch_condition');
    expect(SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.map(item => item.code)).not.toContain('match_candidate');
    expect(SEMANTIC_EMISSION_KNOWLEDGE.map(item => item.code)).toEqual(['result', 'exception']);
  });
});


describe('Phase 168 semantic absence is data', () => {
  it('does not encode domain absence with optional properties or undefined', () => {
    const block = classifyPhpBlock(tokenizePhpSource('for (;;) { return; }').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const iteration = graph.facts.find(fact => fact.kind === 'repetition');

    expect(iteration?.kind).toBe('repetition');
    if (iteration?.kind === 'repetition') {
      expect(iteration.value.predicate.kind).toBe('absent');
      expect(iteration.value.predicate.kind === 'absent' && iteration.value.predicate.reason.code).toBe('empty_clause');
      expect(iteration.value.initialization.kind).toBe('absent');
      expect(iteration.value.update.kind).toBe('absent');
      expect(iteration.value.iterable.kind).toBe('absent');
      expect(iteration.value.binding.kind).toBe('absent');
    }
  });

  it('represents void result explicitly instead of omitting the emitted value', () => {
    const block = classifyPhpBlock(tokenizePhpSource('return;').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const emission = graph.facts.find(fact => fact.kind === 'emission');

    expect(emission?.kind).toBe('emission');
    if (emission?.kind === 'emission') {
      expect(emission.value.definition.code).toBe('result');
      expect(emission.value.value.kind).toBe('absent');
      expect(emission.value.value.kind === 'absent' && emission.value.value.reason.code).toBe('void_emission');
    }
  });
});

describe('Phase 174 expression knowledge is typed', () => {
  it('raises casts, arrays, static calls, constructions, and type checks as facts', () => {
    const source = '$a = (int) $x; $b = ["key" => $a, $x]; Foo::bar($b); new Foo($b); $x instanceof Foo;';
    const block = classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);

    expect(graph.facts.some(fact => fact.kind === 'cast')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'array')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'static-invocation')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'construction')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'type-check')).toBe(true);
  });

  it('does not downgrade magic constants and interpolated strings to opaque values', () => {
    const source = '$x = __FILE__; $y = "hello $name";';
    const block = classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);

    expect(graph.facts.some(fact => fact.kind === 'magic-constant')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'interpolated-string')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'unsupported-expression')).toBe(false);
  });

  it('represents closures and arrow functions as callable knowledge', () => {
    const source = '$f = function ($x) { return $x; }; $g = fn ($x) => $x;';
    const block = classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);

    expect(graph.facts.some(fact => fact.kind === 'closure')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'arrow-function')).toBe(true);
  });
});


describe('Phase 176 canonical facts own identity; indexes only validate', () => {
  it('keeps every produced fact in the canonical facts collection instead of deduplicating through a Set', () => {
    const source = '$x = $a + $b; $y = $a + $b;';
    const block = classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const operations = graph.facts.filter(fact => fact.kind === 'binary-operation');

    expect(operations).toHaveLength(2);
    expect(new Set(operations.map(fact => knowledgeIdKey(fact.value.id))).size).toBe(2);
  });

  it('keeps data-flow edges as references into canonical facts', () => {
    const block = classifyPhpBlock(tokenizePhpSource('$x = $a;').filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const factIds = new Set(graph.facts.map(fact => knowledgeIdKey(fact.value.id)));

    expect(graph.relations.every(edge => factIds.has(knowledgeIdKey(edge.from)) && factIds.has(knowledgeIdKey(edge.to)))).toBe(true);
  });
});


describe('Phase 177 knowledge identity is structured occurrence identity', () => {
  it('does not encode the syntax-node kind or a graph path inside KnowledgeId', () => {
    const source = '$x = $a === $b;';
    const block = classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF'));
    const graph = produceSemanticKnowledgeDataFlow(block);
    const comparison = graph.facts.find(fact => fact.kind === 'comparison');

    expect(comparison).toBeDefined();
    if (comparison?.kind === 'comparison') {
      expect(comparison.value.id.identity.kind).toBe('knowledge-identity');
      expect(comparison.value.id.identity.role).toBe('expression');
      expect(comparison.value.id.identity.slot).toEqual({ kind: 'text', value: 'self' });
      expect(comparison.value.id.identity.source.span.start.value).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Phase 178 canonical data-flow facts', () => {
  it('stores dependency and value-flow as typed data, with relations only as a derived projection', () => {
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource('<?php $x = $a + $b; ?>').filter(token => token.type !== 'EOF')));
    expect(graph.dataFlow.length).toBeGreaterThan(0);
    expect(graph.dataFlow.every(flow => ['dependency', 'value-flow'].includes(flow.kind))).toBe(true);
    expect(graph.relations.length).toBe(graph.dataFlow.length);
    expect(graph.relations.every((edge, index) => {
      const flow = graph.dataFlow[index];
      return knowledgeIdKey(edge.from) === knowledgeIdKey(flow.source)
        && knowledgeIdKey(edge.to) === knowledgeIdKey(flow.target);
    })).toBe(true);
  });

  it('does not make the derived edge shape the canonical data-flow source', () => {
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource('<?php $x = $a; ?>').filter(token => token.type !== 'EOF')));
    expect(Object.keys(graph)).toEqual(['facts', 'dataFlow', 'relations']);
    expect(graph.dataFlow.some(flow => flow.kind === 'value-flow')).toBe(true);
  });
});


describe('Phase 179 semantic data-flow roles', () => {
  it('raises operand, operator, predicate, and branch participation into typed flow data', () => {
    const source = 'if ($a === $b) { $x = $a + $b; } else { $x = $b; }';
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF')));

    expect(graph.dataFlow.some(flow => flow.kind === 'dependency' && flow.role.code === 'operator')).toBe(true);
    expect(graph.dataFlow.some(flow => flow.kind === 'dependency' && flow.role.code === 'operand_left')).toBe(true);
    expect(graph.dataFlow.some(flow => flow.kind === 'dependency' && flow.role.code === 'operand_right')).toBe(true);
    expect(graph.dataFlow.some(flow => flow.kind === 'dependency' && flow.role.code === 'predicate')).toBe(true);
    expect(graph.dataFlow.some(flow => flow.kind === 'dependency' && flow.role.code === 'branch_outcome')).toBe(true);
  });

  it('distinguishes argument, receiver, index, iterable, body, and assignment value-flow roles', () => {
    const source = '$x = $obj->run($items[$i]); foreach ($items as $item) { $x = $item; }';
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF')));
    const dependencyRoles = new Set(graph.dataFlow.filter(flow => flow.kind === 'dependency').map(flow => flow.role.code));

    expect(dependencyRoles.has('receiver')).toBe(true);
    expect(dependencyRoles.has('argument')).toBe(true);
    expect(dependencyRoles.has('index')).toBe(true);
    expect(dependencyRoles.has('iterable')).toBe(true);
    expect(dependencyRoles.has('target')).toBe(true);
    expect(dependencyRoles.has('body')).toBe(true);
    expect(graph.dataFlow.some(flow => flow.kind === 'value-flow' && flow.role.code === 'target')).toBe(true);
  });

  it('keeps data-flow roles semantic and contains no control-flow vocabulary', () => {
    const forbidden = new Set(['next', 'previous', 'successor', 'predecessor', 'reenters', 'executes', 'branches_to']);
    expect(SEMANTIC_DATA_FLOW_ROLE_KNOWLEDGE.every(role => !forbidden.has(role.code))).toBe(true);
  });
});


describe('Phase 179 statement semantics are not lost at the syntax boundary', () => {
  it('raises include and unset into semantic facts and typed data-flow', () => {
    const source = 'include $path; unset($a, $b); require_once $config;';
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF')));

    const includes = graph.facts.filter(fact => fact.kind === 'include');
    const unset = graph.facts.find(fact => fact.kind === 'unset');

    expect(includes).toHaveLength(2);
    expect(includes.some(fact => fact.kind === 'include' && fact.value.definition.code === 'include')).toBe(true);
    expect(includes.some(fact => fact.kind === 'include' && fact.value.definition.code === 'require_once')).toBe(true);
    expect(unset?.kind).toBe('unset');
    if (unset?.kind === 'unset') expect(unset.value.targets).toHaveLength(2);
    expect(graph.dataFlow.some(flow => flow.kind === 'dependency' && flow.role.code === 'expression')).toBe(true);
  });
});


describe('Phase 179 assignment semantics', () => {
  it('raises assignment operator and reference mode into semantic data', () => {
    const source = '$x += $y; $z =& $x;';
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF')));
    const assignments = graph.facts.filter(fact => fact.kind === 'assignment');

    expect(assignments).toHaveLength(2);
    expect(assignments.map(fact => fact.kind === 'assignment' ? fact.value.operator.code : '')).toEqual(['add', 'set']);
    expect(assignments.map(fact => fact.kind === 'assignment' ? fact.value.reference.code : '')).toEqual(['by_value', 'by_reference']);
  });
});


describe('Phase 181 control-flow concepts are not semantic ontology', () => {
  it('represents result and exception production as emission data, not transitions', () => {
    const source = 'return $value; throw $error;';
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource(source).filter(token => token.type !== 'EOF')));
    const emissions = graph.facts.filter(fact => fact.kind === 'emission');

    expect(emissions).toHaveLength(2);
    expect(emissions.every(fact => fact.kind === 'emission')).toBe(true);
    expect(emissions.map(fact => fact.kind === 'emission' ? fact.value.definition.code : '')).toEqual(['result', 'exception']);
    expect(graph.facts.some(fact => fact.kind === 'transition')).toBe(false);
  });

  it('represents block containment as scope data rather than execution region data', () => {
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource('{ $x = 1; }').filter(token => token.type !== 'EOF')));
    expect(graph.facts.some(fact => fact.kind === 'scope')).toBe(true);
    expect(graph.facts.some(fact => fact.kind === 'region')).toBe(false);
    expect(graph.dataFlow.some(flow => flow.kind === 'dependency' && flow.role.code === 'member')).toBe(true);
  });

  it('does not expose control-flow ontology through canonical fact or relation vocabulary', () => {
    const forbidden = new Set([
      'transition', 'region', 'successor', 'predecessor', 'reenters',
      'terminates', 'returns', 'throws', 'catches', 'executes', 'branches_to',
    ]);
    const graph = produceSemanticKnowledgeDataFlow(classifyPhpBlock(tokenizePhpSource('if ($x) { while ($y) { $z = $x; } }').filter(token => token.type !== 'EOF')));
    expect(graph.facts.map(fact => fact.kind).every(kind => !forbidden.has(kind))).toBe(true);
    expect(graph.dataFlow.every(flow => !forbidden.has(flow.role.code))).toBe(true);
  });
});

/** Phase 273 — parser adapter emits evidence/relations, never control ontology. */
import { producePhpAstSemanticKnowledgeDataFlow } from './phpAstSemanticKnowledgeDataFlowAdapter';

const sourceAt = (offset: number) => ({ startOffset: offset, endOffset: offset + 1 });
const literal = (offset: number) => ({ kind: 'literal', value: true, source: sourceAt(offset) });
const block = (statements: readonly unknown[]) => ({ kind: 'block', statements }) as never;
const statement = (kind: string, offset: number, extra: Record<string, unknown> = {}) => ({ kind, source: sourceAt(offset), ...extra });

const body = (offset: number) => block([statement('expression_statement', offset + 1, { expression: literal(offset + 2) })]);
const cases = [{ kind: 'case', labels: [literal(41)], body: body(42), fallThrough: false, source: sourceAt(43) }];

const model = producePhpAstSemanticKnowledgeDataFlow(block([
  statement('if_statement', 1, { condition: literal(2), thenBlock: body(3), alternative: { kind: 'none' } }),
  statement('while_statement', 10, { condition: literal(11), body: body(12) }),
  statement('for_statement', 20, {
    initializer: { kind: 'empty' },
    condition: { kind: 'expression', value: literal(21) },
    update: { kind: 'empty' },
    body: body(22),
  }),
  statement('switch_statement', 30, { subject: literal(31), cases }),
  statement('expression_statement', 50, { expression: { kind: 'ternary_expression', condition: literal(51), trueBranch: literal(52), falseBranch: literal(53), source: sourceAt(50) } }),
  statement('expression_statement', 60, { expression: { kind: 'null_coalesce', left: literal(61), right: literal(62), source: sourceAt(60) } }),
  statement('expression_statement', 70, { expression: { kind: 'match_expression', subject: literal(71), arms: [{ kind: 'conditional', conditions: [literal(72)], value: literal(73), source: sourceAt(74) }], source: sourceAt(70) } }),
]));

if ('controlRelations' in model) throw new Error('parser adapter must not emit controlRelations');

const forbiddenKinds = new Set(['choice', 'repetition', 'decision', 'loop', 'branch']);
for (const fact of model.facts) {
  if (forbiddenKinds.has(fact.kind)) {
    throw new Error(`legacy control fact leaked from parser adapter: ${fact.kind}`);
  }
}

for (const relation of model.semanticRelations ?? []) {
  if (forbiddenKinds.has(relation.relation)) {
    throw new Error(`legacy control relation leaked from parser adapter: ${relation.relation}`);
  }
}

for (const required of ['condition', 'candidate', 'requires', 'reaches', 'recurs']) {
  const present = (model.semanticRelations ?? []).some(fact => fact.relation === required)
    || (model.semanticClosure?.facts ?? []).some(fact => fact.relation === required);
  if (!present) throw new Error(`expected canonical relation missing: ${required}`);
}

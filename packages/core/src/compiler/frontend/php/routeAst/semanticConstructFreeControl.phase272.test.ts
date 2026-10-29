/** Phase 272 — control syntax projects only into neutral semantic relations. */
import { projectCanonicalSemanticRelations } from './semanticCanonicalRelationProjection';

const id = (role: string, slot: string) => ({
  identity: {
    source: { filePath: { value: 'x' }, span: { start: { value: 0 }, end: { value: 1 } } },
    role,
    slot: { value: slot },
  },
});

const model = {
  facts: [
    { kind: 'predicate', value: { id: id('predicate', 'p') } },
  ],
  dataFlow: [
    { kind: 'dependency', source: id('region', 'r'), target: id('predicate', 'p'), role: { code: 'predicate' }, guard: { kind: 'absent', reason: { code: 'not_provided' } } },
    { kind: 'dependency', source: id('region', 'r'), target: id('scope', 'body'), role: { code: 'body' }, guard: { kind: 'absent', reason: { code: 'not_provided' } } },
  ],
} as never;

const relations = projectCanonicalSemanticRelations(model);
if (!relations.some(fact => fact.relation === 'condition')) throw new Error('condition relation missing');
if (!relations.some(fact => fact.relation === 'requires')) throw new Error('requires relation missing');
if (!relations.some(fact => fact.relation === 'candidate')) throw new Error('candidate relation missing');
if (relations.some(fact => ['choice', 'decision', 'repetition', 'loop', 'branch'].includes(fact.relation))) {
  throw new Error('legacy control ontology leaked into canonical projection');
}

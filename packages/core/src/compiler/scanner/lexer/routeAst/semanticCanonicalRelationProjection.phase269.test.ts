import { projectCanonicalSemanticRelations } from './semanticCanonicalRelationProjection';

const model = {
  facts: [
    { kind: 'predicate', value: { id: { kind: 'knowledge-id', identity: { kind: 'knowledge-identity', source: { filePath: { kind: 'text', value: 'x' }, span: { start: { kind: 'source-offset', value: 0 }, end: { kind: 'source-offset', value: 1 } }, evidence: { code: 'parser' } }, role: 'predicate', slot: 'p' } } } },
    { kind: 'match', value: { id: { kind: 'knowledge-id', identity: { kind: 'knowledge-identity', source: { filePath: { kind: 'text', value: 'x' }, span: { start: { kind: 'source-offset', value: 1 }, end: { kind: 'source-offset', value: 2 } }, evidence: { code: 'parser' } }, role: 'match', slot: 'm' } }, candidate: { kind: 'knowledge-id', identity: { kind: 'knowledge-identity', source: { filePath: { kind: 'text', value: 'x' }, span: { start: { kind: 'source-offset', value: 2 }, end: { kind: 'source-offset', value: 3 } }, evidence: { code: 'parser' } }, role: 'value', slot: 'c' } }, subject: { kind: 'knowledge-id', identity: { kind: 'knowledge-identity', source: { filePath: { kind: 'text', value: 'x' }, span: { start: { kind: 'source-offset', value: 3 }, end: { kind: 'source-offset', value: 4 } }, evidence: { code: 'parser' } }, role: 'value', slot: 's' } }, mode: { code: 'strict' }, source: undefined as never } },
  ],
  dataFlow: [],
} as never;

const relations = projectCanonicalSemanticRelations(model);
if (relations.some(fact => ['choice', 'decision', 'repetition', 'loop', 'branch'].includes(fact.relation))) {
  throw new Error('legacy control ontology leaked into canonical relation projection');
}
if (!relations.some(fact => fact.relation === 'condition')) throw new Error('condition relation missing');
if (!relations.some(fact => fact.relation === 'candidate')) throw new Error('candidate relation missing');

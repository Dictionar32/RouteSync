import { closeCanonicalSemanticRelations, canonicalSemanticFact } from './semanticClosureEngine';

const closure = closeCanonicalSemanticRelations([
  canonicalSemanticFact('condition', ['scope', 'admin']),
  canonicalSemanticFact('candidate', ['scope', 'save']),
  canonicalSemanticFact('requires', ['save', 'admin']),
  canonicalSemanticFact('precedes', ['a', 'b']),
  canonicalSemanticFact('precedes', ['b', 'a']),
]);

const has = (relation: string, args: readonly unknown[]) => closure.facts.some(fact =>
  fact.relation === relation && fact.arguments.length === args.length && fact.arguments.every((value, index) => value === args[index]),
);

if (!has('permits', ['scope', 'save'])) throw new Error('permit closure missing');
if (!has('reaches', ['a', 'a'])) throw new Error('self reachability missing');
if (!has('recurs', ['a', 'a'])) throw new Error('recurrence closure missing');
if (!closure.saturated) throw new Error('canonical closure did not saturate');
if (closure.facts.some(fact => ['choice', 'decision', 'repetition', 'loop', 'branch'].includes(fact.relation))) throw new Error('legacy control ontology leaked into closure');
if (closure.evidence.length < closure.facts.length) throw new Error('proof/evidence coverage missing');

let rejected = false;
try {
  closeCanonicalSemanticRelations([
    { relation: 'choice' as never, arguments: ['x', 'y'] },
  ]);
} catch {
  rejected = true;
}
if (!rejected) throw new Error('legacy control relation crossed canonical boundary');

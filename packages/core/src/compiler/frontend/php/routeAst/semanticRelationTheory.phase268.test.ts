import { assertCanonicalSemanticRelationName, semanticTheoryFact, validateSemanticTheoryFact } from './semanticRelationTheory';

const condition = semanticTheoryFact('condition', ['scope', 'admin'], ['php-if']);
validateSemanticTheoryFact(condition);
if (condition.terms?.[0].sort !== 'entity') throw new Error('entity sort was not assigned');
if (condition.terms?.[1].sort !== 'predicate') throw new Error('predicate sort was not assigned');

assertCanonicalSemanticRelationName('condition');
let rejected = false;
try {
  assertCanonicalSemanticRelationName('choice');
} catch {
  rejected = true;
}
if (!rejected) throw new Error('legacy choice relation crossed the canonical semantic boundary');

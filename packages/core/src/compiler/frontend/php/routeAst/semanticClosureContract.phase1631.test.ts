import { solveSemanticBehavior } from '../../../../types/upstream/semanticRelationalBehaviorKernel';
import { semanticClosureRuntimeOperations } from '../../../../types/upstream/semanticClosureEngine';
import { semanticTheoryFact } from '../../../../types/upstream/semanticRelationTheory';

const seed = [
  { relation: 'condition', arguments: ['scope', 'predicate'] },
  { relation: 'candidate', arguments: ['scope', 'value'] },
  { relation: 'requires', arguments: ['value', 'predicate'] },
] as const;

const incomplete = solveSemanticBehavior(seed, 1);
if (incomplete.status !== 'incomplete') throw new Error('round-limited constraint reasoning was incorrectly reported as closed');
if (incomplete.phase !== 'constraints') throw new Error('constraint-stage incompleteness was not preserved');
if (incomplete.saturated) throw new Error('incomplete closure must not claim saturation');
if (incomplete.rounds > 1) throw new Error('constraint closure exceeded its configured round limit');

const closed = solveSemanticBehavior(seed);
if (closed.status !== 'closed' || !closed.saturated) throw new Error('fully saturated behavior reasoning was not reported as closed');
if (!closed.derivations.some(derivation => derivation.stage === 'constraint')) throw new Error('constraint derivation provenance was discarded');
if (!closed.derivations.some(derivation => derivation.stage === 'rewrite')) throw new Error('rewrite derivation provenance was discarded');

const projected = semanticClosureRuntimeOperations.closeRelations([
  semanticTheoryFact('condition', ['scope', 'predicate']),
  semanticTheoryFact('candidate', ['scope', 'value']),
  semanticTheoryFact('requires', ['value', 'predicate']),
], 1);
if (projected.status !== 'incomplete' || projected.phase !== 'constraints') throw new Error('canonical closure projection erased upstream incompleteness');
if (projected.saturated) throw new Error('canonical projection must preserve the incomplete judgment');
if (!projected.evidence.some(evidence => evidence.source === 'constraint')) throw new Error('constraint provenance was not preserved in closure evidence');

console.log('SEMANTIC-CLOSURE-CONTRACT-PHASE1631-PASS');

import {
  SEMANTIC_BEHAVIOR_PROGRAM,
  SEMANTIC_BEHAVIOR_SCHEMAS,
  SEMANTIC_BEHAVIOR_RULES,
  solveSemanticBehavior,
} from './semanticRelationalBehaviorKernel';
import { validateSemanticRelationProgram } from './semanticRelationProgram';

const diagnostics = validateSemanticRelationProgram(SEMANTIC_BEHAVIOR_PROGRAM);
if (diagnostics.length !== 0) throw new Error(`canonical semantic program is invalid: ${JSON.stringify(diagnostics)}`);
if (SEMANTIC_BEHAVIOR_PROGRAM.schemas !== SEMANTIC_BEHAVIOR_SCHEMAS) throw new Error('canonical program must own the canonical schemas');
if (SEMANTIC_BEHAVIOR_PROGRAM.rules !== SEMANTIC_BEHAVIOR_RULES) throw new Error('canonical program must own the canonical rewrites');

const solved = solveSemanticBehavior([
  { relation: 'condition', arguments: ['scope', 'predicate'] },
  { relation: 'candidate', arguments: ['scope', 'value'] },
  { relation: 'requires', arguments: ['value', 'predicate'] },
]);

if (!solved.facts.some(fact => fact.relation === 'permits' && fact.arguments.join('|') === 'scope|value')) {
  throw new Error('declarative semantic program did not derive permits(scope,value)');
}
if (!solved.saturated) throw new Error('canonical semantic program did not saturate');

console.log('SEMANTIC-PROGRAM-PASS');

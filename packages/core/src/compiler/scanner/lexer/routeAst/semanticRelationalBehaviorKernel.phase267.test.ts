import { solveSemanticBehavior, type SemanticBehaviorFact } from './semanticRelationalBehaviorKernel';

const fact = (relation: SemanticBehaviorFact['relation'], ...args: SemanticBehaviorFact['arguments']) => ({
  relation,
  arguments: args,
} as const);

const key = (relation: SemanticBehaviorFact) => `${relation.relation}(${relation.arguments.join(',')})`;

const result = solveSemanticBehavior([
  fact('condition', 'scope', 'admin'),
  fact('candidate', 'scope', 'save'),
  fact('requires', 'save', 'admin'),
  fact('depends', 'save', 'load'),
  fact('produces', 'load', 'user'),
  fact('consumes', 'save', 'user'),
  fact('precedes', 'load', 'save'),
  fact('precedes', 'save', 'load'),
] as any);

const keys = new Set(result.facts.map(value => key(value as any)));
if (!keys.has('permits(scope,save)')) throw new Error('permission relation was not derived');
if (!keys.has('precedes(load,save)')) throw new Error('dependency precedence was not preserved');
if (!keys.has('reaches(load,load)')) throw new Error('transitive reachability was not derived');
if (!keys.has('recurs(load,load)')) throw new Error('recurrence was not derived from a cycle');
if (!keys.has('converges(load,load,load)')) throw new Error('convergence relation was not derived');

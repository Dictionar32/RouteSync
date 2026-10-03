import { solveSemanticRelationsDetailed, type SemanticRelationRewrite } from './semanticRewriteEngine';

type R = 'parent' | 'child' | 'root';
const variable = (variable: string) => ({ variable } as const);
const pattern = (relation: R, ...arguments_: readonly (string | ReturnType<typeof variable>)[]) => ({ relation, arguments: arguments_ });

const rules: readonly SemanticRelationRewrite<R>[] = [
  { id: 'parent-to-child', priority: 10, when: [pattern('parent', variable('x'), variable('y'))], then: [pattern('child', variable('y'), variable('x'))] },
  { id: 'child-to-root', priority: 9, when: [pattern('child', variable('x'), variable('y'))], then: [pattern('root', variable('x'), variable('y'))] },
];

const result = solveSemanticRelationsDetailed(
  [{ relation: 'parent', arguments: ['A', 'B'] }],
  rules,
);

const has = (relation: R, args: string[]) => result.facts.some(f => f.relation === relation && f.arguments.join('|') === args.join('|'));
if (!has('child', ['B', 'A'])) throw new Error('child derivation missing');
if (!has('root', ['B', 'A'])) throw new Error('root derivation missing');
if (result.derivations.length !== 2) throw new Error(`unexpected derivation count: ${result.derivations.length}`);
if (!result.saturated) throw new Error('solver did not saturate');
console.log('phase236 relation solver runtime test: PASS');

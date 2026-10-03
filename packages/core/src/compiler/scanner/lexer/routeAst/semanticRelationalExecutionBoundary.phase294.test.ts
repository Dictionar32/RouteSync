import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { relation, union, antiJoin, fixedPoint } from './semanticRelationalAlgebra';
import { SemanticRelationStore } from './semanticRelationStore';
import { solveSemanticRelationsDetailed, type SemanticRelation, type SemanticRelationRewrite } from './semanticRelationSolver';

const authorityFiles = [
  'phpAstSemanticKnowledgeDataFlowAdapter.ts',
  'semanticRelationSolver.ts',
  'semanticConstraintCalculus.ts',
  'semanticRewriteEngine.ts',
  'semanticRelationalAlgebra.ts',
  'semanticRelationStore.ts',
  'semanticEvidenceRelationCompiler.ts',
  'semanticClosureEngine.ts',
  'semanticRelationProgram.ts',
  'semanticRelationTheory.ts',
] as const;

const forbidden = /\b(if|for|while|switch|map|filter|reduce|flatMap)\b|\.(map|filter|reduce|flatMap)\s*\(/g;
const legacy = /SemanticChoice|SemanticRepetition|controlRelations|semanticControl|semanticRuleEngine|statementKnowledge/g;

authorityFiles.forEach(file => {
  const source = readFileSync(resolve(__dirname, file), 'utf8');
  if (forbidden.test(source)) throw new Error(`Forbidden semantic execution construct in ${file}`);
  if (legacy.test(source)) throw new Error(`Legacy semantic ontology in ${file}`);
});

const source = relation([['a', 'b'], ['b', 'c']] as const);
const extra = relation([['c', 'd']] as const);
const merged = union(source, extra);
const blocked = antiJoin(merged, relation([['b', 'c']] as const), tuple => tuple.join(':'), tuple => tuple.join(':'));
if (blocked.tuples.length !== 2) throw new Error('relational anti-join failed');

const closure = fixedPoint(source, state => {
  const current = state.stable.tuples;
  const additions = current.reduce<readonly (readonly string[])[]>((output, left) => {
    const matches = current.reduce<readonly (readonly string[])[]>((inner, right) =>
      left[1] === right[0] ? [...inner, [left[0], right[1]]] : inner,
      [],
    );
    return [...output, ...matches];
  }, []);
  return relation(additions as readonly (readonly ('a' | 'b' | 'c')[])[]);
}, 8);
if (!closure.tuples.some(tuple => tuple[0] === 'a' && tuple[1] === 'c')) throw new Error('relational fixed point failed');

const store = SemanticRelationStore.from([
  { relation: 'precedes', arguments: ['a', 'b'] },
  { relation: 'precedes', arguments: ['b', 'c'] },
]);
if (store.bucket('precedes', 2).length !== 2) throw new Error('typed relation store index failed');

const rules: readonly SemanticRelationRewrite<'precedes' | 'reaches'>[] = [
  {
    id: 'transitive-reach',
    priority: 1,
    when: [
      { relation: 'precedes', arguments: [{ variable: 'a' }, { variable: 'b' }] },
      { relation: 'precedes', arguments: [{ variable: 'b' }, { variable: 'c' }] },
    ],
    then: [{ relation: 'reaches', arguments: [{ variable: 'a' }, { variable: 'c' }] }],
  },
];
const solved = solveSemanticRelationsDetailed(
  [
    { relation: 'precedes', arguments: ['a', 'b'] },
    { relation: 'precedes', arguments: ['b', 'c'] },
  ],
  rules,
  8,
);
if (!solved.facts.some((fact: SemanticRelation) => fact.relation === 'reaches' && fact.arguments[0] === 'a' && fact.arguments[1] === 'c')) {
  throw new Error('indexed semantic solver failed');
}

console.log('PHASE294-TYPED-RELATIONAL-EXECUTION-PASS');

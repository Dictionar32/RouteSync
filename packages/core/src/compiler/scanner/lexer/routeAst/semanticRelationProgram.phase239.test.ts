import {
  assertSemanticRelationProgram,
  validateSemanticRelationProgram,
} from './semanticRelationProgram';

const variable = (variable: string) => ({ variable } as const);
const pattern = (relation: string, ...arguments_: readonly (string | ReturnType<typeof variable>)[]) => ({ relation, arguments: arguments_ });

const valid = {
  schemas: [
    { relation: 'edge' as const, arity: 2 },
    { relation: 'reachable' as const, arity: 2 },
  ],
  rules: [
    {
      id: 'edge-to-reachable',
      priority: 1,
      when: [pattern('edge', variable('from'), variable('to'))],
      then: [pattern('reachable', variable('from'), variable('to'))],
    },
  ],
};

assertSemanticRelationProgram(valid);
if (validateSemanticRelationProgram(valid).length !== 0) throw new Error('valid program rejected');

const invalid = {
  schemas: [{ relation: 'edge' as const, arity: 2 }],
  rules: [
    {
      id: 'bad-output',
      priority: 1,
      when: [pattern('edge', variable('from'), variable('to'))],
      then: [pattern('missing', variable('unknown'), variable('to'))],
    },
  ],
};
const diagnostics = validateSemanticRelationProgram(invalid);
if (!diagnostics.some(diagnostic => diagnostic.code === 'unknown-relation')) throw new Error('unknown relation was not diagnosed');
if (!diagnostics.some(diagnostic => diagnostic.code === 'unbound-variable')) throw new Error('unbound variable was not diagnosed');
console.log('phase239 relation program validation: PASS');

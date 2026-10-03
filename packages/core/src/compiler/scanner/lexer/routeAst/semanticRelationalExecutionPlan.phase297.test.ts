import { compileSemanticRelationExecutionPlans } from './semanticRelationalExecutionPlan';
import { solveSemanticRelationsDetailed } from './semanticRewriteEngine';

const rules = [
  {
    id: 'reach',
    priority: 10,
    when: [
      { relation: 'precedes', arguments: [{ variable: 'a' }, { variable: 'b' }] },
      { relation: 'precedes', arguments: [{ variable: 'b' }, { variable: 'c' }] },
    ],
    then: [{ relation: 'reaches', arguments: [{ variable: 'a' }, { variable: 'c' }] }],
  },
  {
    id: 'guarded',
    priority: 5,
    when: [
      { relation: 'blocked', polarity: 'negative', arguments: [{ variable: 'a' }] },
      { relation: 'candidate', arguments: [{ variable: 'a' }] },
    ],
    then: [{ relation: 'permits', arguments: [{ variable: 'a' }] }],
  },
] as const;

const plans = compileSemanticRelationExecutionPlans(rules);
const reach = plans.find(plan => plan.ruleId === 'reach');
const guarded = plans.find(plan => plan.ruleId === 'guarded');

if (reach?.premises[0]?.kind !== 'scan') throw new Error('positive anchor was not lowered to scan');
if (guarded?.premises[0]?.kind !== 'scan') throw new Error('negative-leading declaration was not normalized around a positive anchor');
if (guarded?.premises[1]?.kind !== 'anti-join') throw new Error('negative premise was not lowered to anti-join');
if (reach?.emissions[0]?.kind !== 'emit') throw new Error('head was not lowered to emit');

const solved = solveSemanticRelationsDetailed([
  { relation: 'precedes', arguments: ['a', 'b'] },
  { relation: 'precedes', arguments: ['b', 'c'] },
  { relation: 'candidate', arguments: ['x'] },
], rules);

if (!solved.facts.some(fact => fact.relation === 'reaches' && fact.arguments.join('|') === 'a|c')) throw new Error('relational closure failed');
if (!solved.facts.some(fact => fact.relation === 'permits' && fact.arguments.join('|') === 'x')) throw new Error('negative relational plan failed');

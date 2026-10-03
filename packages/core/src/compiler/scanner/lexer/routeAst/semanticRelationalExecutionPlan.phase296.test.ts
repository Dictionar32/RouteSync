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
] as const;

const plans = compileSemanticRelationExecutionPlans(rules);
if (plans.length !== 1 || plans[0]?.anchor?.relation !== 'precedes') throw new Error('relational execution plan was not compiled');
if (plans[0]?.premises.length !== 2 || plans[0]?.emissions.length !== 1) throw new Error('relational execution plan shape is invalid');

const solved = solveSemanticRelationsDetailed([
  { relation: 'precedes', arguments: ['a', 'b'] },
  { relation: 'precedes', arguments: ['b', 'c'] },
], rules);
if (!solved.facts.some(fact => fact.relation === 'reaches' && fact.arguments.join('|') === 'a|c')) throw new Error('planned relational closure failed');

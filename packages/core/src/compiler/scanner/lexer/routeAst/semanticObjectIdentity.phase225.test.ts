import { knowledgeId, semanticSource, type SemanticKnowledgeDataFlow } from './semanticKnowledgeDataFlowRelations';
import { analyzeSemanticObjectIdentity, semanticAlias } from './semanticObjectIdentityRelations';

const source = semanticSource('phase225.php', 0, 1);
const id = (slot: string) => knowledgeId(source, 'variable', slot);

const left = id('left');
const right = id('right');
const assignment = knowledgeId(source, 'assignment', 'alias');

const model: SemanticKnowledgeDataFlow = {
  facts: [{
    kind: 'assignment',
    value: {
      id: assignment,
      target: left,
      value: right,
      operator: { code: 'set' },
      reference: { code: 'by_reference' },
      source,
    },
  }],
  dataFlow: [],
  relations: [],
};

const analysis = analyzeSemanticObjectIdentity(model);
if (analysis.status !== 'closed') throw new Error('Phase 361: semantic identity closure must be complete.');
const same = semanticAlias(analysis, left, left);
const alias = semanticAlias(analysis, left, right);

if (same.status !== 'resolved' || same.value.kind !== 'present' || same.value.value !== 'must-alias') {
  throw new Error('Phase 361: identical semantic identities must alias.');
}

if (alias.status !== 'resolved' || alias.value.kind !== 'present' || alias.value.value !== 'may-alias') {
  throw new Error('Phase 361: by-reference assignment must produce may-alias.');
}

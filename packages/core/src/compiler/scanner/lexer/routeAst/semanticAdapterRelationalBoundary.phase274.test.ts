/** Phase 274 — semantic adapter exposes only the relational boundary. */
import { producePhpAstSemanticKnowledgeDataFlow } from './phpAstSemanticKnowledgeDataFlowAdapter';

const model = producePhpAstSemanticKnowledgeDataFlow({ kind: 'block', statements: [] }, '<phase274>');

if ('controlRelations' in model) {
  throw new Error('Phase 274 semantic adapter must not expose controlRelations.');
}

if (!('semanticRelations' in model) || !('semanticClosure' in model)) {
  throw new Error('Phase 274 semantic adapter must expose canonical relational closure.');
}

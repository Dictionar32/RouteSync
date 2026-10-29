const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const knowledgePath = path.join(root, 'packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const knowledge = fs.readFileSync(knowledgePath, 'utf8');
const collections = fs.readFileSync(collectionsPath, 'utf8');
const deleted = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
  'packages/core/src/semantic/kernel/relationMembership.ts',
  'packages/core/src/semantic/kernel/relationalSequence.ts',
];
const checks = [
  ['upstream knowledge no longer imports deleted relation foundation', !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)/.test(knowledge)],
  ['knowledge selection has a named domain interface', /interface SemanticKnowledgeSelectionOperationsInterface/.test(knowledge)],
  ['knowledge selection is a private typed runtime operation object', /const semanticKnowledgeSelectionOperations:\s*SemanticKnowledgeSelectionOperationsInterface\s*=\s*Object\.freeze\(/.test(knowledge)],
  ['assignment effect resolution is owned by upstream knowledge', /resolve:\s*semanticKnowledgeSelectionOperations\.assignmentEffect/.test(knowledge)],
  ['assignment reference resolution is owned by upstream knowledge', /resolve:\s*semanticKnowledgeSelectionOperations\.assignmentReference/.test(knowledge)],
  ['flow-role resolution is owned by upstream knowledge', /resolve:\s*semanticKnowledgeSelectionOperations\.dataFlowRole/.test(knowledge)],
  ['optional guard conversion is owned by upstream knowledge', (knowledge.match(/semanticKnowledgeSelectionOperations\.optionalGuard\(guard\)/g) || []).length === 2],
  ['collections.ts remains empty', collections.length === 0],
  ['deleted relation foundations remain absent; kernel compatibility stubs remain empty', deleted.slice(0, 3).every(file => !fs.existsSync(path.join(root, file))) && deleted.slice(3).every(file => fs.existsSync(path.join(root, file)) && fs.statSync(path.join(root, file)).size === 0)],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
console.log(JSON.stringify({ phase: 2983, audit: 'upstream-knowledge-runtime', passed: results.filter(x => x.pass).length, total: results.length, results }, null, 2));
if (results.some(x => !x.pass)) process.exitCode = 1;

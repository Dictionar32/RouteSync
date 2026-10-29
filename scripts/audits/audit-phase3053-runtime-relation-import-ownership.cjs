const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const consumers = [
  'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts',
  'packages/core/src/compiler/frontend/php/routeAst/semanticEvidenceRelationCompiler.ts',
  'packages/core/src/compiler/frontend/php/routeAst/semanticVersionedStateDataFlowRelations.ts',
  'packages/core/src/compiler/frontend/php/routeAst/semanticRelationStore.ts',
  'packages/core/src/compiler/relational/sequence.ts',
];
const forbidden = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
  'packages/core/src/semantic/relations/semanticRelationalCollections.ts',
];
const results = [];
for (const file of consumers) {
  const full = path.join(root, file);
  const present = fs.existsSync(full);
  const source = present ? fs.readFileSync(full, 'utf8') : '';
  const imports = [...source.matchAll(/from\s+['"]([^'"]*semantic\/relations\/[^'"]+)['"]/g)].map(match => match[1]);
  results.push({ check: `consumer exists: ${file}`, pass: present, detail: present ? `${imports.length} direct import(s) from removed relation namespace` : 'missing consumer' });
}
for (const file of forbidden) {
  results.push({ check: `removed foundation stays absent: ${file}`, pass: !fs.existsSync(path.join(root, file)), detail: fs.existsSync(path.join(root, file)) ? 'forbidden file restored' : 'absent' });
}
const passed = results.filter(result => result.pass).length;
console.log(JSON.stringify({ phase: 3053, title: 'Runtime relation import ownership audit', passed, total: results.length, status: passed === results.length ? 'PASS' : 'FAIL', results }, null, 2));
if (passed !== results.length) process.exitCode = 1;

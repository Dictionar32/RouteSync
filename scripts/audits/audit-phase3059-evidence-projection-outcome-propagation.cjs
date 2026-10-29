const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const interfacePath = 'packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts';
const producerPath = 'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts';
const adapterPath = 'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts';
const indexPath = 'packages/core/src/types/upstream/index.ts';
const interfaceSource = read(interfacePath);
const producer = read(producerPath);
const adapter = read(adapterPath);
const index = read(indexPath);
const packageJson = JSON.parse(read('package.json'));
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const forbidden = ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts', 'semanticRelationalCollections.ts'];
const projection = interfaceSource.match(/export interface SemanticKnowledgeEvidenceProjection\s*\{[^}]+\}/s)?.[0] ?? '';
const checks = [
  ['upstream defines a language-neutral production outcome ADT', /export type SemanticKnowledgeEvidenceProductionOutcome\s*=/.test(interfaceSource) && /kind: 'produced'/.test(interfaceSource) && /kind: 'blocked'/.test(interfaceSource)],
  ['blocked outcome retains typed validation violations', /kind: 'blocked'[\s\S]*?violations: readonly SemanticKnowledgeDataFlowValidationViolation\[\]/.test(interfaceSource)],
  ['projection preserves source identity and evidence provenance', /readonly sourceFile: SourceFile/.test(projection) && /readonly evidenceProvider: SemanticEvidenceProvider/.test(projection)],
  ['projection carries production outcome as domain data', /readonly productionOutcome: SemanticKnowledgeEvidenceProductionOutcome/.test(projection)],
  ['PHP evidence adapter calls outcome-producing operation', /produceWithOutcome\(/.test(producer) && /productionOutcome,/.test(producer)],
  ['projection retains the canonical knowledge for compatibility', /knowledge: productionOutcome\.knowledge/.test(producer)],
  ['upstream contract does not import PHP compiler implementation', !/from ['"][^'"]*compiler\/frontend\/php/.test(interfaceSource)],
  ['production outcome is exported from the upstream type barrel', /SemanticKnowledgeEvidenceProductionOutcome/.test(index)],
  ['typed producer outcome remains defined in upstream rather than duplicated', /SemanticKnowledgeEvidenceProductionOutcome/.test(adapter) && !/export type PhpAstSemanticKnowledgeDataFlowProductionOutcome\s*=\s*\n?\s*\|/.test(adapter)],
  ['deleted generic relation foundations remain absent', forbidden.every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections invariant remains exactly one newline byte', collections.equals(Buffer.from('\n'))],
  ['audit command is registered', packageJson.scripts['audit:phase3059-evidence-projection-outcome-propagation'] === 'node scripts/audits/audit-phase3059-evidence-projection-outcome-propagation.cjs'],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3059, title: 'Evidence projection outcome propagation', passed: results.filter(result => result.pass).length, total: results.length, status: results.every(result => result.pass) ? 'PASS' : 'FAIL', results };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;

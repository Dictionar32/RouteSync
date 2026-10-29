const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const adapterPath = 'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts';
const producerPath = 'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts';
const upstreamPath = 'packages/core/src/types/upstream/semanticDataflowKnowledgeContinuation.ts';
const evidenceInterfacePath = 'packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts';
const adapter = fs.readFileSync(path.join(root, adapterPath), 'utf8');
const producer = fs.readFileSync(path.join(root, producerPath), 'utf8');
const upstream = fs.readFileSync(path.join(root, upstreamPath), 'utf8');
const evidenceInterface = fs.readFileSync(path.join(root, evidenceInterfacePath), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const forbidden = ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts', 'semanticRelationalCollections.ts'];
const checks = [
  ['producer outcome is an explicit closed ADT', /export type PhpAstSemanticKnowledgeDataFlowProductionOutcome\s*=/.test(adapter) && /SemanticKnowledgeEvidenceProductionOutcome/.test(adapter) && /kind: 'produced'/.test(evidenceInterface) && /kind: 'blocked'/.test(evidenceInterface)],
  ['blocked producer outcome retains model and typed violations', /readonly knowledge: SemanticKnowledgeDataFlow/.test(evidenceInterface) && /readonly violations: readonly SemanticKnowledgeDataFlowValidationViolation\[\]/.test(evidenceInterface)],
  ['scanner producer contract exposes the typed input outcome operation', /readonly produceWithOutcome: \(input: PhpAstSemanticKnowledgeDataFlowProductionInput\) => PhpAstSemanticKnowledgeDataFlowProductionOutcome/.test(producer) && /export const semanticKnowledgeDataFlowProducer: SemanticKnowledgeDataFlowProducerInterface/.test(producer)],
  ['new outcome operation returns produced or blocked without throwing', /const validation = validateSemanticKnowledgeDataFlow\(model\)/.test(adapter) && /kind: 'produced', knowledge: model/.test(adapter) && /kind: 'blocked', knowledge: model, violations: validation\.violations/.test(adapter)],
  ['legacy graph-only convenience is isolated under an explicit legacy name', /Explicitly isolated compatibility boundary/.test(producer) && /legacySemanticKnowledgeDataFlowProducer/.test(producer)],
  ['strict producer operation accepts the typed input object', /produceWithOutcome: \(input: PhpAstSemanticKnowledgeDataFlowProductionInput\)/.test(adapter)],
  ['upstream continuation retains continue and blocked outcomes', /kind: 'continue'/.test(upstream) && /kind: 'blocked'/.test(upstream)],
  ['audit package script is registered', packageJson.scripts['audit:phase3057-typed-producer-outcome'] === 'node scripts/audits/audit-phase3057-typed-producer-outcome.cjs'],
  ['deleted generic relation foundations remain absent', forbidden.every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections invariant remains exactly one newline byte', collections.equals(Buffer.from('\n'))],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3057, title: 'Typed PHP semantic producer outcome', passed: results.filter(result => result.pass).length, total: results.length, status: results.every(result => result.pass) ? 'PASS' : 'FAIL', results };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;

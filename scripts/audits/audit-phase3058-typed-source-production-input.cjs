const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const adapterPath = 'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts';
const producerPath = 'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts';
const sourceModelPath = 'packages/core/src/types/upstream/semanticDataflowKnowledge.ts';
const adapter = read(adapterPath);
const producer = read(producerPath);
const sourceModel = read(sourceModelPath);
const packageJson = JSON.parse(read('package.json'));
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const forbidden = ['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts', 'semanticRelationalCollections.ts'];
const inputInterface = adapter.match(/export interface PhpAstSemanticKnowledgeDataFlowProductionInput\s*\{[^}]+\}/s)?.[0] ?? '';
const producerInterface = producer.match(/export interface SemanticKnowledgeDataFlowProducerInterface\s*\{[^}]+\}/s)?.[0] ?? '';
const checks = [
  ['production input is a required typed object', /readonly block: PhpBlock;/.test(inputInterface) && /readonly sourceFile: SourceFile;/.test(inputInterface) && /readonly evidenceProvider: SemanticEvidenceProvider;/.test(inputInterface)],
  ['production input contract contains no optional or raw string parameters', !/\?/.test(inputInterface) && !/\bstring\b/.test(inputInterface)],
  ['adapter operations consume one typed input object', /readonly produceWithOutcome: \(input: PhpAstSemanticKnowledgeDataFlowProductionInput\)/.test(adapter) && /readonly produce: \(input: PhpAstSemanticKnowledgeDataFlowProductionInput\)/.test(adapter)],
  ['runtime producer exposes only typed outcome production', /readonly produceWithOutcome: \(input: PhpAstSemanticKnowledgeDataFlowProductionInput\)/.test(producerInterface) && !/\bstring\b|\?/.test(producerInterface)],
  ['legacy convenience API is explicitly isolated', /legacySemanticKnowledgeDataFlowProducer/.test(producer) && /Explicitly isolated compatibility boundary/.test(producer)],
  ['typed source identity is used to create source evidence', /readonly createForFile: \(sourceFile: SourceFile, startOffset: number, endOffset: number, evidence: SemanticEvidenceProvider\)/.test(sourceModel) && /semanticSource\.createForFile\(sourceFile/.test(adapter)],
  ['evidence provenance is passed as a typed provider value', /evidenceProvider: SemanticEvidenceProvider/.test(inputInterface) && /sourceFile, evidenceProvider/.test(adapter)],
  ['direct adapter tests use the explicit input object', /sourceFile, evidenceProvider/.test(read('packages/core/src/compiler/frontend/php/routeAst/semanticAdapterConstructFree.phase273.test.ts')) && /sourceFileIdentityFactory/.test(read('packages/core/src/compiler/frontend/php/routeAst/semanticAdapterRelationalBoundary.phase274.test.ts'))],
  ['deleted generic relation foundations remain absent', forbidden.every(name => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name)))],
  ['collections invariant remains exactly one newline byte', collections.equals(Buffer.from('\n'))],
  ['audit command is registered', packageJson.scripts['audit:phase3058-typed-source-production-input'] === 'node scripts/audits/audit-phase3058-typed-source-production-input.cjs'],
];
const results = checks.map(([name, pass]) => ({ name, pass }));
const report = { phase: 3058, title: 'Typed source production input', passed: results.filter(result => result.pass).length, total: results.length, status: results.every(result => result.pass) ? 'PASS' : 'FAIL', results };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;

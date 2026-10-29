const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['model contract remains coherent at version 4', /readonly version: 4/.test(model) && /version: 4,/.test(model)],
  ['canonical knowledge remains on semanticKnowledgeProjection only', model.includes('readonly semanticKnowledgeProjection: SemanticKnowledgeEvidenceProjection;') && !model.includes('readonly semanticKnowledgeDataFlow:')],
  ['model has no duplicate knowledge field contract', model.includes('noDuplicateKnowledgeField')],
  ['authority result extends the single binding-judgment model', /ControllerDataflowInvocationSemanticModelInterface<\s*ControllerDataflowBindingSemanticJudgmentInterface/.test(authorityInterface)],
  ['authority version 4 is consistent across interface, implementation and contract', authorityInterface.includes('readonly contractVersion: 4;') && authorityInterface.includes('readonly version: 4;') && authority.includes('contractVersion: 4,') && authorityInterface.includes('  version: 4,')],
  ['authority composes integrated response from the exact canonical knowledge local', /const knowledge = input\.semanticKnowledgeProjection\.knowledge/.test(authority) && /integrate\(\{\s*knowledge,\s*phpSourceInvocationPipeline: input\.invocationJudgment\.response/s.test(authority) && !authority.includes('semanticKnowledgeDataFlow: knowledge')],
  ['invocation judgment and integrated response stay distinct output fields', model.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;') && model.includes('readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult;')],
  ['analyzer passes one canonical invocation judgment and calls one authority', analyzer.includes('invocationJudgment: judgment') && analyzer.includes('semanticJudgmentAuthority.derive')],
  ['scanner boundary contract remains at 92 and documents canonical knowledge ownership', scannerContract.includes('readonly version: 92;') && scannerContract.includes('version: 92,') && scannerContract.includes('controllerDataflowKnowledgeIdentityBoundary')],
  ['public upstream barrel still exports model and authority interfaces', barrel.includes("export * from './controllerDataflowInvocationSemanticModelInterface';") && barrel.includes("export * from './controllerDataflowSemanticJudgmentAuthorityInterface';")],
  ['no new type assertions in the changed semantic authority files', !/\sas\s/.test([model, authorityInterface, authority, analyzer].join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const facade = read('packages/core/src/compiler/frontend/php/astClassifier.ts');
const port = read('packages/core/src/compiler/frontend/php/astClassifierEvidence.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['legacy AST exports converge on existing ADT port', /from '\.\/astClassifierEvidence'/.test(facade)],
  ['legacy facade has no relation/foundation dependency', !/semantic\/(?:relations|foundation)/.test(facade)],
  ['canonical port still delegates semantic evidence to existing producer', /produceAstSemanticEvidence/.test(port) && /AstSemanticStageInterface/.test(port)],
  ['AST runtime contract-construction debt remains visible for follow-up', /createAstClassificationContract/.test(runtime) && /semanticDecisionAlgebra\.resolve/.test(runtime)],
  ['invocation judgment preserves distinct integrated outcomes', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every(kind => judgment.includes(`php_source_invocation_integration_${kind}`))],
  ['integrated response contract forbids semantic reconstruction', /never-reconstruct-or-upgrade-semantic-judgments-during-projection/.test(integration)],
  ['controller scanner consumes invocation judgment from inventory correspondences', /invocationInventoryReceipt\.correspondences/.test(scanner) && /invocationJudgment/.test(scanner)],
  ['no relation/foundation subscanner is introduced by this phase', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;

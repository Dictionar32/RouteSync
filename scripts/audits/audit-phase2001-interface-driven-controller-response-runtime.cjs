const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed, detail });

const pipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const publicIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');

check('pipeline-implements-existing-interface', pipeline.includes('LaravelControllerResponseSemanticPipelineInterface') && pipeline.includes('export const laravelControllerResponseSemanticPipeline'), 'Concrete composition is exposed through the existing upstream pipeline interface.');
check('source-identity-owner-reused', pipeline.includes('laravelSourceIdentitySemantics.relateSourceFiles') && pipeline.includes('sourceIdentitySemantics: laravelSourceIdentitySemantics'), 'Source correlation and evidence binding use the existing source identity authority.');
check('declaration-correlation-precedes-production', scanner.includes('pipeline.correlateDeclarationSource') && scanner.indexOf('pipeline.correlateDeclarationSource') < scanner.indexOf('pipeline.evidenceProduction.produce'), 'Declaration correlation is evaluated before response evidence production.');
check('rejected-correlation-stops-production', scanner.includes('controller_response_declaration_source_correlation_rejected') && scanner.includes('case \'controller_response_evidence_declaration_source_correlation_rejected\''), 'A mismatched declaration source produces a rejected ADT instead of entering evidence production.');
check('evidence-producer-retains-candidate-origin', pipeline.includes("origin: 'controller-action-descriptor-response-type'") && pipeline.includes("kind: 'controller_action_response_reference_candidate'"), 'Descriptor-derived evidence retains candidate provenance.');
check('source-binding-delegates-identity', pipeline.includes('evidenceSourceBinding') && pipeline.includes('relateSourceFiles(input.invocationJudgment.sourceFile, evidence.sourceFile)'), 'Each response candidate receives an explicit source identity judgment.');
check('runtime-executor-delegates-authority', pipeline.includes('execute: executeResponse') && pipeline.includes('return responseSemanticAuthority.judge(input)'), 'Runtime executor delegates to the response semantic authority.');
check('descriptor-candidate-does-not-promote-to-success', pipeline.includes("kind: 'response_contract_unresolved'") && !pipeline.includes("kind: 'controller_response_complete'"), 'Descriptor candidates are conservatively blocked rather than promoted into a complete response product.');
check('scanner-consumes-response-pipeline', scanner.includes('pipeline.evidenceProduction.produce') && scanner.includes('pipeline.evidenceSourceBinding.bind') && scanner.includes('pipeline.responseExecutor.execute'), 'Scanner executes the injected response pipeline.');
check('artifact-retains-response-judgment', scanner.includes('responseJudgment,') && scanner.includes('projectionJudgment,') && scannerContract.includes('readonly responseJudgment:'), 'The scanner artifact preserves the response judgment and AST projection judgment.');
check('ast-projection-consumes-pair', scanner.includes("kind: 'integrated_invocation_response_judgment'") && scanner.includes('responseSemanticPipeline.astProjection.judge'), 'AST projection receives the exact invocation/response pair.');
check('scanner-contract-version-aligned', scanner.includes('contractVersion: 26') && scannerContract.includes('contractVersion: 26'), 'Runtime scanner and public scanner contract both use current version 26.');
check('no-new-relation-foundation-subscanner', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/laravelControllerResponseSemanticPipeline.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/laravelControllerResponseSemanticFoundation.ts')), 'No relation/foundation response subscanner was introduced; composition lives in upstream contracts.');
check('public-export-present', publicIndex.includes("export { laravelControllerResponseSemanticPipeline } from './types/upstream/laravelControllerResponseSemanticPipeline'") && upstreamIndex.includes("export { laravelControllerResponseSemanticPipeline } from './laravelControllerResponseSemanticPipeline'"), 'The interface-driven pipeline is available through public and upstream exports.');
check('contract-forbids-semantic-reclassification', contract.includes('scanner-and-runtime-executor-forward-existing-judgments-and-never-reclassify-descriptors-or-reconstruct-provenance'), 'The existing contract continues to forbid runtime semantic reclassification.');

const passed = checks.filter(item => item.passed).length;
const report = {
  phase: 2001,
  audit: 'interface-driven-controller-response-runtime',
  passed,
  total: checks.length,
  status: passed === checks.length ? 'passed' : 'failed',
  checks,
};
fs.writeFileSync(path.join(root, 'PHASE2001_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (passed !== checks.length) process.exitCode = 1;

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const invocationPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const integrationPath = path.join(root, 'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const runtimeScannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const invocation = fs.readFileSync(invocationPath, 'utf8');
const integration = fs.readFileSync(integrationPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const runtimeScanner = fs.readFileSync(runtimeScannerPath, 'utf8');

const checks = [
  ['outcome alias is projected from canonical integration ADT discriminant', /export type LaravelControllerInvocationIntegratedResponseOutcomeKind\s*=\s*PhpSourceInvocationSemanticPipelineIntegrationResult\[['"]kind['"]\]/.test(invocation)],
  ['outcome alias does not duplicate literal outcome names', !/export type LaravelControllerInvocationIntegratedResponseOutcomeKind\s*=\s*[\s\S]*?;/.exec(invocation)?.[0].includes('php_source_invocation_integration_')],
  ['canonical integration ADT remains the declared owner', /export type PhpSourceInvocationSemanticPipelineIntegrationResult\s*=/.test(integration)],
  ['not-connected judgment remains explicitly named', /export type LaravelControllerInvocationNotConnectedJudgment\s*=/.test(invocation)],
  ['source-binding-rejected judgment remains explicitly named', /export type LaravelControllerInvocationSourceBindingRejectedJudgment\s*=/.test(invocation)],
  ['complete judgment remains explicitly named', /export type LaravelControllerInvocationCompleteJudgment\s*=/.test(invocation)],
  ['blocked judgment remains explicitly named', /export type LaravelControllerInvocationBlockedJudgment\s*=/.test(invocation)],
  ['scanner artifact keeps explicit four-branch ADT', (scanner.match(/LaravelControllerScanArtifactBase</g) || []).length >= 4],
  ['ancestry lattice/fixed-point contract remains explicitly documented', /least_fixed_point_over_resolved_inventory/.test(fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts'), 'utf8'))],
  ['runtime scanner remains untouched by this interface-only phase and relation/subscanner debt is visible', /semantic\/relations/.test(runtimeScanner) && /scanControllerAction/.test(runtimeScanner)],
];

for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

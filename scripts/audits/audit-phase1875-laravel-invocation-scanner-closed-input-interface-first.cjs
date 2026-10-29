#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const composition = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const lexer = read('packages/core/src/compiler/scanner/LaravelSourceLexer.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['scanner input is exactly the upstream integrated-response ADT', /type InvocationPhpSourceIntegratedResponse = PhpSourceInvocationSemanticPipelineIntegrationResult/.test(contract)],
  ['composition contract version advanced to 17', /readonly version: 17/.test(contract) && /version: 17,/.test(contract)],
  ['composition explicitly forbids raw evidence across scanner-facing boundary', /scannerInputClosureBoundary/.test(contract) && /raw-composition-evidence-cannot-cross-this-boundary/.test(contract)],
  ['composition input carries only the closed integrated response', /phpSourceInvocationPipeline: InvocationPhpSourceIntegratedResponse/.test(contract)],
  ['composition forwards the response unchanged without integration branching', /phpFunctionInvocations: input\.phpSourceInvocationPipeline/.test(composition) && !/phpInvocationIntegration|integratedPhpSourceResponse/.test(composition)],
  ['scanner analyzer does not import or invoke integration authority', !/phpSourceInvocationSemanticPipelineIntegrationAuthority|phpSourceInvocationPipelineEvidenceFromSourceBinding/.test(analyzer)],
  ['scanner parser defaults to explicit integrated not-connected outcome', /php_source_invocation_integration_not_connected/.test(lexer) && !/kind: 'php_source_invocation_pipeline_not_connected' \}\)\)/.test(lexer)],
  ['source-binding adapter projects before invoking scanner analyzer', /phpSourceInvocationSemanticPipelineIntegrationAuthority\.project\(phpSourceInvocationPipelineEvidenceFromSourceBinding\(sourceBinding\)\)/.test(binding)],
  ['composition no longer owns the integration authority dependency', !/phpInvocationIntegration/.test(contract) && !/phpInvocationIntegration/.test(composition)],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(contract + composition + analyzer + binding)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1875-laravel-invocation-scanner-closed-input-interface-first'] === 'node scripts/audits/audit-phase1875-laravel-invocation-scanner-closed-input-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

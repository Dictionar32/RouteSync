#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const types = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const facade = read('packages/core/src/compiler/scanner/LaravelSourceLexer.ts');
const declaration = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const method = read('packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts');
const body = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const packageJson = JSON.parse(read('package.json'));
const activePath = [facade, declaration, method, body, binding, analyzer].join('\n');
const checks = [
  ['canonical scanner-facing type is the integrated response alias', /export type InvocationPhpSourceIntegratedResponse = PhpSourceInvocationSemanticPipelineIntegrationResult/.test(types) && !/InvocationPhpSourcePipelineInput/.test(types)],
  ['controller parser forwards integrated response without evidence terminology', !/pipelineEvidence|PipelineInput/.test(activePath) && /integratedResponse/.test(declaration) && /integratedResponse/.test(method) && /integratedResponse/.test(body)],
  ['dataflow executor receives the closed integrated response type', /InvocationPhpSourceIntegratedResponse/.test(analyzer) && /phpSourceInvocationPipeline: integratedResponse/.test(analyzer)],
  ['composition root forwards the response unchanged', /analyzeControllerDataflowWithIntegratedResponse/.test(binding) && /integratedResponse: InvocationPhpSourceIntegratedResponse/.test(binding) && /createControllerDataflowAnalyzer\(controllerVariableSemanticRuntimeExecutor, integratedResponse\)/.test(binding)],
  ['canonical parser receives the full source-correlated judgment', /const fullPath = invocationJudgment\.sourceFile\.value\.value/.test(scanner) && /parseControllerDeclarationFromInvocationJudgment\([^;]*invocationJudgment\)/s.test(scanner)],
  ['upstream contract states parser integrated-response ownership', /readonly parserIntegratedResponseBoundary/.test(contract) && /canonical-parser-entry-accepts-one-source-correlated-judgment/.test(contract)],
  ['controller boundary contract/value tracks current v63', /readonly version: 65/.test(contract) && /version: 65,/.test(contract)],
  ['all four integration outcomes remain discriminated upstream', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every((outcome) => integration.includes(`php_source_invocation_integration_${outcome}`))],
  ['audit command is registered', packageJson.scripts?.['audit:phase1878-laravel-integrated-response-parser-contract-interface-first'] === 'node scripts/audits/audit-phase1878-laravel-integrated-response-parser-contract-interface-first.cjs'],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(activePath + contract + types)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

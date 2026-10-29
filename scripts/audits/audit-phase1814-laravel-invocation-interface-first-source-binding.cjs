#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const methodParser = read('packages/core/src/compiler/frontend/php/controllerMethodParser.ts');
const bodyParser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const cli = read('packages/cli/src/parsers/php/sourceInvocationPipeline.ts');
const checks = [
 ['current boundary contract is v51', /readonly version: 51/.test(boundary) && /version: 51,/.test(boundary)],
 ['whole-file binding precedes method body projection', boundary.includes('wholeFileInvocationInputBoundary') && boundary.includes('before-method-body-projection')],
 ['source identity binding is upstream-owned', boundary.includes('sourceIdentityBinding') && boundary.includes('source-file-identity-must-be-validated')],
 ['pipeline outcomes remain distinct', boundary.includes('pipelineOutcomePreservation') && boundary.includes('complete-blocked-and-not-connected')],
 ['CLI owns whole-file pipeline composition', cli.includes('createPhpSourceInvocationSemanticPipelineAuthority')],
 ['canonical scanner forwards response from judgment', /parseControllerDeclarationFromInvocationJudgment\([^;]*invocationJudgment\)/s.test(scanner)],
 ['parser path uses integrated response contract', bodyParser.includes('InvocationPhpSourceIntegratedResponse') && methodParser.includes('InvocationPhpSourceIntegratedResponse') && binding.includes('InvocationPhpSourceIntegratedResponse')],
 ['scanner does not import CLI', !scanner.includes("from '@routesync/cli'") && !methodParser.includes("from '@routesync/cli'")],
 ['no semantic foundation reintroduced', !boundary.includes('semantic/foundation') && !bodyParser.includes('semantic/foundation')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed).length;
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;

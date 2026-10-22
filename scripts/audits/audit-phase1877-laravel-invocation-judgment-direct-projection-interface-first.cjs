#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['controller scanner boundary tracks current v63', /readonly version: 65/.test(scannerContract) && /version: 65,/.test(scannerContract)],
  ['scanner input and output contracts track current v15', (scannerContract.match(/readonly contractVersion: 15;/g) || []).length === 2],
  ['judgment remains the sole source identity carrier for scanner projection', /const \{ invocationJudgment \} = sourceInput;/.test(scanner) && /const fullPath = invocationJudgment\.sourceFile\.value\.value;/.test(scanner)],
  ['integrated response is projected directly from the correlated judgment', /parseControllerDeclarationFromInvocationJudgment\([^;]*invocationJudgment\)/s.test(scanner)],
  ['no detached response alias is created in the canonical scanner', !/pipelineEvidence|InvocationPhpSourcePipelineInput|InvocationPhpSourceIntegratedResponse/.test(scanner)],
  ['interface contract explicitly forbids detached integrated response copies', /integratedResponseProjectionBoundary/.test(scannerContract) && /canonical-controller-parser-receives-the-whole-source-correlated-judgment/.test(scannerContract)],
  ['all four response outcomes remain part of the judgment model', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every((outcome) => judgment.includes(`php_source_invocation_integration_${outcome}`))],
  ['audit command is registered', packageJson.scripts?.['audit:phase1877-laravel-invocation-judgment-direct-projection-interface-first'] === 'node scripts/audits/audit-phase1877-laravel-invocation-judgment-direct-projection-interface-first.cjs'],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(scanner + scannerContract + judgment)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

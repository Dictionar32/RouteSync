#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const controllerDirectory = 'packages/core/src/compiler/scanner/subscanners/controller';
const retirement = read('packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const emptyFiles = ['actionVariableTracker.ts', 'controllerErrorDetector.ts'];
const nonEmptyFiles = [
  'actionScanner.ts', 'actionValidationExtractor.ts', 'controllerAstCanonical.ts',
  'controllerBodyResolver.ts', 'controllerDataflowContract.ts', 'controllerProducer.ts',
  'index.ts', 'resourceDataflowAggregator.ts', 'resourceInvocationDetector.ts',
  'responseAttributeScanner.ts', 'responseDetector.ts', 'responseDtoReader.ts',
];
const checks = [
  ['retirement interface is version 2 and explicitly models the controller directory state', /readonly version: 2/.test(retirement) && /version: 2,/.test(retirement) && /controllerDirectoryState/.test(retirement)],
  ['the two previously emptied controller modules remain zero bytes', emptyFiles.every((file) => fs.statSync(path.join(root, controllerDirectory, file)).size === 0)],
  ['the contract names the exact two emptied modules', emptyFiles.every((file) => retirement.includes(`'${file}'`))],
  ['twelve remaining non-empty controller modules are present', nonEmptyFiles.every((file) => fs.statSync(path.join(root, controllerDirectory, file)).size > 0)],
  ['the contract lists all twelve remaining non-empty controller modules', nonEmptyFiles.every((file) => retirement.includes(`'${file}'`))],
  ['scanner boundary v109 forbids equating retired entry with empty directory', /readonly version: 109/.test(scannerContract) && /subscannerDirectoryRealityBoundary/.test(scannerContract) && /does-not-imply-the-controller-subscanner-directory-is-empty/.test(scannerContract)],
  ['controller producer contract remains upstream-owned', /ControllerProducer/.test(read('packages/core/src/types/upstream/controllerProducerInterface.ts')) && /controllerProducerOwnershipBoundary/.test(scannerContract)],
  ['invocation judgment remains one source-correlated integrated response value', /readonly sourceFile: SourceFile/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts')) && /readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts'))],
  ['parser receives the full invocation judgment', /parseControllerDeclarationFromInvocationJudgment/.test(read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts'))],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(retirement + scannerContract)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1880-laravel-controller-subscanner-state-interface-first'] === 'node scripts/audits/audit-phase1880-laravel-controller-subscanner-state-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

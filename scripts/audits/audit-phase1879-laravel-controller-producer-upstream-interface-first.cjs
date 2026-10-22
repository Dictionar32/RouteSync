#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const producer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts');
const upstream = read('packages/core/src/types/upstream/controllerProducerInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const packageJson = JSON.parse(read('package.json'));
const zeroByteFiles = [
  'packages/core/src/compiler/scanner/subscanners/controller/actionVariableTracker.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/controllerErrorDetector.ts',
];
const activeFiles = [
  'actionScanner.ts', 'actionValidationExtractor.ts', 'controllerAstCanonical.ts',
  'controllerBodyResolver.ts', 'controllerDataflowContract.ts', 'controllerProducer.ts',
  'resourceDataflowAggregator.ts', 'resourceInvocationDetector.ts', 'responseAttributeScanner.ts',
  'responseDetector.ts', 'responseDtoReader.ts',
];
const checks = [
  ['producer input/result/interface contracts are owned upstream', /export interface ControllerProducerInput/.test(upstream) && /export interface ControllerProducerResult/.test(upstream) && /export interface ControllerProducer \{/.test(upstream)],
  ['producer contract declares projection and invocation ownership', /projectionRule:/.test(upstream) && /invocationRule:/.test(upstream)],
  ['subscanner implementation imports upstream contract instead of redefining it', /from '\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/controllerProducerInterface'/.test(producer) && !/export interface ControllerProducer \{/.test(producer) && !/export interface ControllerProducerResult/.test(producer)],
  ['producer implementation is an explicit implementation of the upstream contract', /kind: 'controller_producer'/.test(producer) && /kind: 'controller_producer_contract'/.test(producer) && /const implementation: ControllerProducer/.test(producer)],
  ['upstream scanner boundary tracks current v63 and records producer plus directory-state ownership', /readonly version: 65/.test(scannerContract) && /version: 65,/.test(scannerContract) && /readonly controllerProducerOwnershipBoundary/.test(scannerContract)],
  ['invocation judgment keeps source identity and integrated response as one closed value', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment) && /shapeRule:/.test(judgment)],
  ['parser still accepts the full judgment instead of independent source and response arguments', /parseControllerDeclarationFromInvocationJudgment/.test(parser) && /invocationJudgment\.sourceFile\.value\.value/.test(parser) && /invocationJudgment\.response/.test(parser)],
  ['previously emptied files remain zero bytes', zeroByteFiles.every((file) => fs.statSync(path.join(root, file)).size === 0)],
  ['controller subscanner directory is not falsely represented as entirely empty', activeFiles.every((file) => fs.statSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller', file)).size > 0)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(producer + upstream + scannerContract)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1879-laravel-controller-producer-upstream-interface-first'] === 'node scripts/audits/audit-phase1879-laravel-controller-producer-upstream-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

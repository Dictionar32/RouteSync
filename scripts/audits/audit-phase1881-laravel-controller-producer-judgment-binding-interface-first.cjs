#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/controllerProducerInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const packageJson = JSON.parse(read('package.json'));
const controllerDir = 'packages/core/src/compiler/scanner/subscanners/controller';
const checks = [
  ['producer input accepts the source-correlated judgment instead of independent file/source values', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(upstream) && !/readonly file: SourceFile/.test(upstream) && !/readonly source: SourceSpan/.test(upstream)],
  ['producer output preserves the exact invocation judgment', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(upstream) && /invocationJudgment: input\.invocationJudgment/.test(producer)],
  ['canonical AST source file is derived from the judgment identity', /file: input\.invocationJudgment\.sourceFile/.test(producer) && /start: input\.declaration\.source\.start/.test(producer) && /end: input\.declaration\.source\.end/.test(producer)],
  ['producer contract is advanced to v2 and documents source and response preservation', /readonly version: 2/.test(upstream) && /version: 2,/.test(producer) && /producer-forwards-the-exact-source-correlated-invocation-judgment/.test(upstream)],
  ['scanner passes the same judgment into the producer and publishes its returned judgment', /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(scanner) && /invocationJudgment: produced\.invocationJudgment/.test(scanner)],
  ['scanner input/output contracts remain aligned at the current interface version', (boundary.match(/readonly contractVersion: 16;/g) || []).length === 2 && /contractVersion: 16,/.test(scanner) && /readonly version: 109/.test(boundary) && /version: 109,/.test(boundary)],
  ['judgment remains outcome-correlated with four exact integrated-response outcomes', ['php_source_invocation_integration_not_connected','php_source_invocation_integration_source_binding_rejected','php_source_invocation_integration_complete','php_source_invocation_integration_blocked'].every(kind => judgment.includes(kind))],
  ['the previously emptied actionVariableTracker remains zero bytes', fs.statSync(path.join(root, controllerDir, 'actionVariableTracker.ts')).size === 0],
  ['the previously emptied controllerErrorDetector remains zero bytes', fs.statSync(path.join(root, controllerDir, 'controllerErrorDetector.ts')).size === 0],
  ['no semantic/foundation dependency is introduced', !/semantic\/foundation/.test(upstream + producer + scanner + boundary)],
  ['audit script is registered', packageJson.scripts?.['audit:phase1881-laravel-controller-producer-judgment-binding-interface-first'] === 'node scripts/audits/audit-phase1881-laravel-controller-producer-judgment-binding-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

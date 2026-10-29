#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const resolver = runtime.slice(runtime.indexOf('function classifyArrayAccess('), runtime.indexOf('\nfunction findOuterArrayAccessEvidence', runtime.indexOf('function classifyArrayAccess(')));
const checks = [
  ['assignment-target evidence ADT preserves malformed token evidence', contract.includes("readonly kind: 'malformed'") && contract.includes('TokenEvidenceLocation<Token>')],
  ['array-access callback is parameterized by the source token type', contract.includes('AssignmentTargetEvidenceJudgment<AssignmentTargetArrayAccessEvidence<Expression>, Token>')],
  ['canonical target algebra propagates malformed array-access judgment', algebra.includes("if (arrayAccess.kind === 'malformed') return arrayAccess")],
  ['array-access resolver returns a judgment instead of RelationOption', resolver.includes('AssignmentTargetEvidenceJudgment<AssignmentTargetArrayAccessEvidence<PhpAstValue>, TokenDescriptor>') && !resolver.includes('RelationOption<PhpAstValue>')],
  ['malformed delimiter is returned as data, not thrown or flattened', resolver.includes("case 'malformed': return Object.freeze({ kind: 'malformed'") && !resolver.includes('throw new AstSourceJudgmentFailureError')],
  ['successful array access returns typed target/index evidence', resolver.includes("kind: 'resolved', evidence: Object.freeze({") && resolver.includes('target: classifyAstTokens(evidence.prefix)') && resolver.includes('index: classifyAstTokens(evidence.contents)')],
  ['assignment-target wiring consumes the canonical judgment directly', runtime.includes('classifyArrayAccess: source => classifyArrayAccess(source)')],
  ['AST source failure boundary still forwards malformed assignment targets', runtime.includes("kind: 'malformed_assignment_target'")],
  ['Laravel invocation semantic judgment and integrated response remain wired', controller.includes('invocationJudgment') && controller.includes('responseJudgment')],
  ['no relation/foundation subscanner was added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['Phase 2039 audit is registered', typeof pkg.scripts['audit:phase2039-assignment-array-access-malformed-judgment-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

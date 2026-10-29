#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerAssignmentTargetContractAlgebra.phase1447.test.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream assignment target interface declares an evidence judgment ADT', contract.includes('export type AssignmentTargetEvidenceJudgment<Evidence, Token = never>') && contract.includes("kind: 'resolved'; readonly evidence: Evidence") && contract.includes("kind: 'unresolved'") && contract.includes("kind: 'malformed'")],
  ['upstream assignment target interface has no relation/foundation dependency', !contract.includes('RelationOption') && !contract.includes('relationFoundation')],
  ['array access callback returns the evidence ADT', contract.includes('classifyArrayAccess: (tokens: readonly Token[]) => AssignmentTargetEvidenceJudgment<')],
  ['member and static-property callbacks return the evidence ADT', contract.includes('classifyMember: (tokens: readonly Token[]) => AssignmentTargetEvidenceJudgment<') && contract.includes('classifyStaticProperty: (tokens: readonly Token[]) => AssignmentTargetEvidenceJudgment<Target, Token>')],
  ['destructuring pattern extraction returns the evidence ADT', contract.includes('patternOfTarget: (target: Target) => AssignmentTargetEvidenceJudgment<Pattern, Token>')],
  ['canonical algebra consumes resolved evidence without option tags', algebra.includes("arrayAccess.kind === 'malformed'") && algebra.includes("arrayAccess.kind === 'resolved'") && algebra.includes('arrayAccess.evidence') && algebra.includes("member.kind === 'resolved'") && algebra.includes("pattern.kind === 'resolved'")],
  ['legacy relation-option compatibility is isolated in the compatibility facade', algebra.includes('legacyOptionJudgment') && algebra.includes('classifyArrayAccess: tokens => legacyOptionJudgment')],
  ['scanner runtime adapts old classifiers into the canonical judgment ADT', runtime.includes("kind: 'resolved' as const, evidence:") && runtime.includes("kind: 'unresolved' as const")],
  ['canonical algebra test uses judgment ADTs rather than RelationOption', !test.includes('RelationOption') && test.includes("kind: 'unresolved' as const") && test.includes("kind: 'resolved' as const, evidence")],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation'))],
  ['phase audit script is registered', typeof packageJson.scripts['audit:phase2033-assignment-target-evidence-adt-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerAssignmentTargetInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerAssignmentTargetAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pkg = JSON.parse(read('package.json'));
const memberEvidence = runtime.slice(runtime.indexOf('function classifyMemberAssignmentEvidence('), runtime.indexOf('\nfunction classifyStaticPropertyAssignmentEvidence', runtime.indexOf('function classifyMemberAssignmentEvidence(')));
const staticEvidence = runtime.slice(runtime.indexOf('function classifyStaticPropertyAssignmentEvidence('), runtime.indexOf('\nfunction classifyMember(', runtime.indexOf('function classifyStaticPropertyAssignmentEvidence(')));
const targetResolution = algebra.slice(algebra.indexOf('const resolveTarget'), algebra.indexOf('/** Canonical assignment-target algebra'));
const checks = [
  ['existing upstream evidence ADT owns resolved, unresolved, and malformed cases', contract.includes('export type AssignmentTargetEvidenceJudgment<Evidence, Token = never>') && contract.includes("readonly kind: 'malformed'" )],
  ['member evidence is expressed as AssignmentTargetEvidenceJudgment', memberEvidence.includes('AssignmentTargetEvidenceJudgment<AssignmentTargetMemberEvidence<PhpAstValue, AstIdentifier>, TokenDescriptor>')],
  ['malformed member operator/property evidence is returned as data', memberEvidence.includes("kind: 'malformed'") && memberEvidence.includes("expected: 'IDENTIFIER'") && !memberEvidence.includes('throw new')],
  ['static-property evidence is expressed as AssignmentTargetEvidenceJudgment', staticEvidence.includes('AssignmentTargetEvidenceJudgment<PhpAssignmentTarget, TokenDescriptor>')],
  ['malformed static-property shape is returned as data', staticEvidence.includes("kind: 'malformed'") && staticEvidence.includes("expected: 'VARIABLE'") && !staticEvidence.includes('throw new')],
  ['canonical target judgment propagates malformed member evidence', targetResolution.includes("if (member.kind === 'malformed') return member")],
  ['canonical target judgment propagates malformed static-property evidence', targetResolution.includes("if (staticProperty.kind === 'malformed') return staticProperty")],
  ['runtime wiring delegates to typed member/static-property judgments', runtime.includes('classifyMember: source => classifyMemberAssignmentEvidence(source)') && runtime.includes('classifyStaticProperty: source => classifyStaticPropertyAssignmentEvidence(source)')],
  ['member evidence no longer gets flattened at the assignment-target wiring site', !runtime.slice(runtime.indexOf('function classifyAssignmentTarget('), runtime.indexOf('function classifyStaticPropertyTarget(')).includes('classifyMember: source => relationOptionFold')],
  ['static-property evidence no longer gets flattened at the assignment-target wiring site', !runtime.slice(runtime.indexOf('function classifyAssignmentTarget('), runtime.indexOf('function classifyStaticPropertyTarget(')).includes('classifyStaticProperty: source => relationOptionFold')],
  ['Laravel invocation judgment and integrated response remain wired', controller.includes('invocationJudgment') && controller.includes('responseJudgment')],
  ['no relation/foundation subscanner was added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['Phase 2040 audit is registered', typeof pkg.scripts['audit:phase2040-assignment-member-static-property-malformed-judgment-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

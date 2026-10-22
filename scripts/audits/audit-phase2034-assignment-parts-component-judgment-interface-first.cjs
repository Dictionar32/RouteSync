#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/scannerAssignmentPartsInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const test = read('packages/core/src/types/upstream/__test__/scannerAssignmentPartsInterfaceAlgebra.phase1444.test.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['assignment target/value callbacks return a closed component judgment', contract.includes('export type AssignmentPartsComponentJudgment<Value>') && contract.includes('classifyTarget: (tokens: readonly Token[]) => AssignmentPartsComponentJudgment<Target>') && contract.includes('classifyValue: (tokens: readonly Token[]) => AssignmentPartsComponentJudgment<Value>')],
  ['component judgment distinguishes resolved values from explicit unresolved evidence', contract.includes("readonly kind: 'resolved'; readonly value: Value") && contract.includes("readonly kind: 'unresolved'; readonly reason: 'not_recognized'")],
  ['canonical algebra consumes judgment payloads rather than undefined sentinels', algebra.includes('targetJudgment.value') && algebra.includes('valueJudgment.value') && algebra.includes("targetJudgment.kind === 'unresolved'") && algebra.includes("valueJudgment.kind === 'unresolved'")],
  ['legacy RelationOption conversion is confined to the compatibility adapter', algebra.includes('const resolveLegacy') && algebra.includes('relationOptionFold(contract.classifyTarget')],
  ['scanner runtime translates target and expression classifiers into explicit judgments', runtime.includes("classifyTarget: source => relationOptionFold(classifyAssignmentTarget(source), () => ({ kind: 'unresolved' as const") && runtime.includes("classifyValue: source => relationGate(relationCount(source) > 0")],
  ['canonical assignment-parts tests use resolved/unresolved judgments', test.includes("kind: 'resolved' as const, value:") && test.includes("kind: 'unresolved' as const, reason: 'not_recognized' as const") && !test.includes('classifyTarget: (source: readonly string[]) => source.length === 1 && source[0]?.startsWith(\'$\') ? source[0] : undefined')],
  ['Laravel invocation and integrated response wiring remain in their existing authority path', read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('invocationJudgment') && read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('responseJudgment')],
  ['no relation/foundation subscanner was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation'))],
  ['phase audit script is registered', typeof packageJson.scripts['audit:phase2034-assignment-parts-component-judgment-interface-first'] === 'string'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;

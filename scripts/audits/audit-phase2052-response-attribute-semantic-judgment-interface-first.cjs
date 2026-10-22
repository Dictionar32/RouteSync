const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/responseAttributeValueSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/responseAttributeValueSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/responseAttributeScanner.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const test = read('packages/core/src/types/upstream/__tests__/response-attribute-value-semantic-authority.phase2052.test.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2052_RESPONSE_ATTRIBUTE_SEMANTIC_JUDGMENT_INTERFACE_FIRST.md');
const inventory = read('scripts/audits/phase2051-runtime-function-inventory.csv');
const migrationStatus = read('scripts/audits/phase2052-runtime-function-migration-status.csv');
const results = [];
const check = (name, fn) => { try { fn(); results.push({ name, ok: true }); } catch (error) { results.push({ name, ok: false, error: error.message }); } };
check('observed response evidence is a closed AST-independent ADT', () => {
  assert.match(contract, /export type ResponseObservedValueEvidence\s*=\s*[\s\S]*?kind: 'literal'[\s\S]*?kind: 'array'[\s\S]*?kind: 'unsupported'/);
  assert.match(contract, /export type ResponseObservedValueJudgment\s*=\s*[\s\S]*?kind: 'resolved'[\s\S]*?kind: 'unsupported_evidence'/);
});
check('semantic authority owns inference and merge contract', () => {
  assert.match(contract, /interface ResponseAttributeValueSemanticJudgmentInterface[\s\S]*?readonly judge:[\s\S]*?readonly merge:/);
  assert.match(authority, /responseAttributeValueSemanticAuthority:[\s\S]*?kind: 'response_attribute_value_semantic_judgment_authority'[\s\S]*?judge,[\s\S]*?merge:/);
});
check('authority uses typed evidence instead of PHP AST dependencies', () => {
  assert.doesNotMatch(authority, /PhpAstValue|TokenDescriptor|compiler\/scanner/);
  assert.match(authority, /switch \(evidence\.kind\)/);
  assert.match(authority, /case 'literal'/);
  assert.match(authority, /case 'array'/);
});
check('authority merge is ADT-returning and deduplicates by typed contract structure', () => {
  assert.match(contract, /export type ResponseValueMergeJudgment\s*=\s*[\s\S]*?kind: 'merged'[\s\S]*?kind: 'empty_input'/);
  assert.match(authority, /const sameValue =/);
  assert.doesNotMatch(authority, /JSON\.stringify|\bas\s+Extract/);
});
check('scanner only projects PHP AST into response evidence before judgment', () => {
  assert.match(scanner, /responseObservedValueEvidence\(value\)/);
  assert.match(scanner, /responseAttributeValueSemanticAuthority\.judge/);
  assert.match(scanner, /responseAttributeValueSemanticAuthority\.merge/);
  assert.doesNotMatch(scanner, /function inferPhpAstValue|function inferNestedArray|function mergeContracts|function relationAnyEqual/);
});
check('unsupported AST expressions remain explicit rather than guessed', () => {
  assert.match(scanner, /kind: 'unsupported'/);
  assert.match(authority, /kind: 'unsupported_evidence'/);
});
check('non-string keyed PHP arrays do not become response object field names', () => {
  assert.match(scanner, /entry\.key\.kind === 'string'[\s\S]*?kind: 'keyed'[\s\S]*?kind: 'positional'/);
});
check('upstream barrel exports the contract and existing authority', () => {
  assert.match(upstreamIndex, /export \* from '\.\/responseAttributeValueSemanticJudgmentInterface'/);
  assert.match(upstreamIndex, /export \{ responseAttributeValueSemanticAuthority \}/);
});
check('regression tests cover literals, object/collection arrays, unsupported evidence, and union merge', () => {
  for (const value of ['all-string-keyed arrays as objects', 'mixed or positional arrays as collections', 'unsupported AST evidence', 'distinct values in a union']) assert.ok(test.includes(value), `missing test: ${value}`);
});
check('Phase 2051 runtime inventory remains included', () => {
  assert.match(inventory.split('\n')[0], /file,line,symbol,declaration,priority,initial_classification/);
  assert.ok(inventory.split('\n').length > 2000);
});
check('migration status distinguishes removed semantic logic from retained adapters and future candidates', () => {
  assert.match(migrationStatus, /inferPhpAstValue,removed/);
  assert.match(migrationStatus, /inferNestedArray,removed/);
  assert.match(migrationStatus, /resolveObservedFields,remaining_semantic_candidate/);
  assert.match(migrationStatus, /astClassifierRuntime\.ts,legacy_adapter rules,remaining_semantic_candidate/);
});
check('report identifies next semantic runtime candidates and excludes subscanners', () => {
  assert.match(report, /responseAttributeScanner\.ts/);
  assert.match(report, /controllerDataflowContract\.ts/);
  assert.match(report, /astClassifierRuntime\.ts/);
  assert.match(report, /No relation\/foundation subscanner/);
});
for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.error ? ` — ${result.error}` : ''}`);
const failed = results.filter(result => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;

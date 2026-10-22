const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const resourceAuthority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-model-origin-closed-judgment.phase2056.test.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2057_STATIC_CALL_ORIGIN_RULE_INTERFACE_FIRST.md');
const checks = [
  ['static-call origin rule pattern is a closed typed ADT', () => { assert.match(contract, /ControllerStaticCallOriginRulePattern[\s\S]*?kind: 'qualified_class_method'[\s\S]*?kind: 'qualified_class'[\s\S]*?kind: 'fallback'/); }],
  ['rule interface declares pattern and typed judgment', () => { assert.match(contract, /interface ControllerStaticCallOriginRuleInterface[\s\S]*?pattern: ControllerStaticCallOriginRulePattern[\s\S]*?argumentRules: readonly ControllerStaticCallOriginArgumentRuleInterface\[\][\s\S]*?judge: \(input: ControllerStaticCallOriginInput\) => ControllerStaticCallOriginJudgment/); }],
  ['existing origin authority exposes ordered rules at the evolved contract version 11', () => { assert.match(contract, /contractVersion: 11/); assert.match(contract, /rules: readonly ControllerStaticCallOriginRuleInterface\[\]/); assert.match(authority, /contractVersion: 11/); }],
  ['specific DB table rule precedes DB facade fallback and model-class fallback', () => { assert.match(authority, /controllerStaticCallOriginRules[\s\S]*?databaseFacadeTableRule,[\s\S]*?databaseFacadeNonTableCallRule,[\s\S]*?staticClassModelOriginRule/); }],
  ['authority no longer depends on relation/foundation helpers', () => { assert.doesNotMatch(authority, /semantic\/relations|semantic\/foundation|relationAll|relationGate|relationOptionFold|relationRefine|relationEqual/); }],
  ['database facade calls without table-origin semantics are not mislabeled as model origins', () => { assert.match(authority, /database_facade_call_without_table_origin/); assert.match(resourceAuthority, /case 'not_applicable':[\s\S]*?kind: 'unresolved'/); assert.match(test, /DB.*select|non-table database facade call/s); }],
  ['DB table argument variants are declared as typed subrules', () => { assert.match(authority, /databaseTableLiteralArgumentRule[\s\S]*?evidenceKind: 'positional_string_literal'[\s\S]*?databaseTableArgumentAbsentRule[\s\S]*?evidenceKind: 'absent'[\s\S]*?databaseTableArgumentUnsupportedRule[\s\S]*?evidenceKind: 'unsupported_argument_shape'/); }],
  ['scanner remains an evidence projector and does not call the static-call authority', () => { assert.match(scanner, /staticCallOriginInput/); assert.doesNotMatch(scanner, /controllerStaticCallOriginAuthority/); }],
  ['phase docs preserve existing authorities and forbid relation/foundation subscanner', () => { assert.match(docs, /No relation\/foundation subscanner was introduced/); assert.match(docs, /no parallel authority was added/); }],
  ['audit is registered in package scripts', () => { assert.match(read('package.json'), /audit:phase2057-static-call-origin-rule-interface-first/); }],
];
const results = checks.map(([name, check]) => {
  try { check(); console.log(`PASS ${name}`); return true; }
  catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; }
});
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
if (passed !== results.length) process.exitCode = 1;

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controllerStaticCallOriginInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerStaticCallOriginAuthority.ts');
const resourceAuthority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-static-call-origin-argument-rules.phase2058.test.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2058_STATIC_CALL_ORIGIN_ARGUMENT_RULE_INTERFACE_FIRST.md');
const pkg = read('package.json');
const checks = [
  ['argument-rule interface declares closed rule identity and evidence discriminant', () => { assert.match(contract, /interface ControllerStaticCallOriginArgumentRuleInterface[\s\S]*?rule: 'table_literal' \| 'table_argument_absent' \| 'table_argument_unsupported'[\s\S]*?evidenceKind: ControllerStaticCallTableArgumentEvidence\['kind'\][\s\S]*?judge:/); }],
  ['parent static-call rule owns explicit argument rules', () => { assert.match(contract, /interface ControllerStaticCallOriginRuleInterface[\s\S]*?argumentRules: readonly ControllerStaticCallOriginArgumentRuleInterface\[\]/); }],
  ['DB table rule registers all three argument variants', () => { assert.match(authority, /databaseTableLiteralArgumentRule[\s\S]*?evidenceKind: 'positional_string_literal'[\s\S]*?databaseTableArgumentAbsentRule[\s\S]*?evidenceKind: 'absent'[\s\S]*?databaseTableArgumentUnsupportedRule[\s\S]*?evidenceKind: 'unsupported_argument_shape'/); }],
  ['DB table origin delegates argument judgment through registered rules', () => { assert.match(authority, /databaseTableOrigin[\s\S]*?databaseTableArgumentRules\.find\(rule => rule\.evidenceKind === input\.tableArgument\.kind\)[\s\S]*?matchingRule\.judge\(input\)/); }],
  ['authority evolved contract includes lexical class-resolution judgment', () => { assert.match(contract, /contractVersion: 11/); assert.match(authority, /contractVersion: 11/); assert.match(authority, /use_one_discriminated_class_reference_and_context_evidence_then_pass_the_same_closed_judgment_to_rule_matching_and_model_identity/); }],
  ['DB table outcomes remain distinct for literal, absent, and unsupported evidence', () => { assert.match(authority, /database_table_argument_absent/); assert.match(authority, /database_table_argument_not_static_string/); assert.match(test, /resolves a string literal[\s\S]*?preserves distinct absent and unsupported/); }],
  ['scanner only projects AST evidence and does not call origin authority', () => { assert.match(scanner, /staticCallOriginInput/); assert.doesNotMatch(scanner, /controllerStaticCallOriginAuthority/); }],
  ['resource authority remains sole model-origin composition owner', () => { assert.match(resourceAuthority, /controllerStaticCallOriginAuthority\.judge\(evidence\.input\)/); assert.match(resourceAuthority, /judgeModelOrigin/); }],
  ['no relation/foundation subscanner or parallel origin authority added', () => { assert.doesNotMatch(docs, /added a new (?:relation|foundation) subscanner|parallel authority was added/i); assert.match(docs, /No relation\/foundation subscanner or parallel authority was introduced/); }],
  ['focused regression test and package audit script are registered', () => { assert.match(test, /describe\('controller static-call origin argument rules phase 2058'/); assert.match(pkg, /audit:phase2058-static-call-origin-argument-rule-interface-first/); }],
];
const results = checks.map(([name, check]) => {
  try { check(); console.log(`PASS ${name}`); return true; }
  catch (error) { console.log(`FAIL ${name} — ${error.message}`); return false; }
});
const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;

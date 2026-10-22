#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['domain binding judgment exists', /export type InvocationArgumentBindingJudgment\s*=/.test(source)],
  ['binding distinguishes not-required, established, incomplete, blocked', ['not-required', 'established', 'incomplete', 'blocked'].every(kind => source.includes(`readonly kind: '${kind}'`))],
  ['binding semantics are part of the model', /readonly argumentBinding: InvocationArgumentBindingSemantics;/.test(source)],
  ['model version advanced', /version: 9,\n\s*meaning: INVOCATION_SEMANTIC_MEANING/.test(source)],
  ['contract version advanced', /readonly version: 20;/.test(source) && /version: 20,\n\s*judgmentBoundary:/.test(source)],
  ['witness carries domain judgment instead of flat bindings', /readonly kind: 'argument-binding';\s*readonly judgment: InvocationArgumentBindingJudgment;/.test(source)],
  ['single judgment exposes argumentBinding', /readonly argumentBinding: InvocationArgumentBindingJudgment;/.test(source)],
  ['aggregate analysis exposes domain judgments', /readonly argumentBindings: readonly InvocationArgumentBindingJudgment\[\];/.test(source)],
  ['legacy flat argumentParameters contract removed', !source.includes('argumentParameters')],
  ['proof binds the argument-binding judgment', source.includes("'argument-binding-judgment'") && source.includes('retainArgumentBindingJudgment: true')],
  ['old retainBindings contract removed', !source.includes('retainBindings')],
];
let failed = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failed++;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;

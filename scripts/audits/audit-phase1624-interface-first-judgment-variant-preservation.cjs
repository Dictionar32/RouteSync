#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['canonical inference interface preserves input and judgment generics', /export interface RequestTypeDerivationSemanticInferenceFor<\s*TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,\s*TInput extends RequestTypeDerivationInput = RequestTypeDerivationInput,\s*TJudgment extends RequestTypeDerivationJudgment = RequestTypeDerivationJudgment,\s*>\s*\{[\s\S]*?readonly input: TInput;[\s\S]*?readonly judgment: TJudgment;/],
  ['semantic reasoning returns the inference packet without widening', /readonly infer: \(\s*input: TInference\['input'\],\s*\) => TInference;/],
  ['authority evaluation remains bound to the inference input', /readonly evaluate: \(\s*input: TInference\['input'\],\s*candidate: RequestTypeDerivationSemanticAuthorityCandidateFor/],
  ['pipeline exposes one source-bound derive operation', /readonly derive: \(\s*input: TInference\['input'\],\s*\) => RequestTypeDerivationSemanticAuthorityAssessmentFor/],
  ['runtime executor implementation is not embedded in upstream types', !source.includes('requestTypeDerivationRuntimeExecutor')],
];
let failed = false;
for (const [label, condition] of checks) {
  const passed = condition instanceof RegExp ? condition.test(source) : condition;
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;

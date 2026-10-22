#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['inference packet preserves exact input and judgment types', /export interface RequestTypeDerivationSemanticInferenceFor<\s*TContract extends RequestTypeDerivationContract = RequestTypeDerivationContract,\s*TInput extends RequestTypeDerivationInput = RequestTypeDerivationInput,\s*TJudgment extends RequestTypeDerivationJudgment = RequestTypeDerivationJudgment,\s*>\s*\{[\s\S]*?readonly input: TInput;[\s\S]*?readonly judgment: TJudgment;/],
  ['reasoning consumes the inference-bound input shape', /readonly infer: \(\s*input: TInference\['input'\],\s*\) => TInference;/],
  ['authority evaluates against the inference-bound input shape', /readonly evaluate: \(\s*input: TInference\['input'\],\s*candidate: RequestTypeDerivationSemanticAuthorityCandidateFor/],
  ['integrity validation checks the inference-bound input shape', /readonly validate: \(\s*expectedInput: TInference\['input'\],/],
  ['consumer pipeline preserves the inference-bound input shape', /readonly derive: \(\s*input: TInference\['input'\],\s*\) => RequestTypeDerivationSemanticAuthorityAssessmentFor/],
  ['runtime executor remains outside upstream interface file', !source.includes('requestTypeDerivationRuntimeExecutor')],
];
let failed = false;
for (const [label, condition] of checks) {
  const passed = condition instanceof RegExp ? condition.test(source) : condition;
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;

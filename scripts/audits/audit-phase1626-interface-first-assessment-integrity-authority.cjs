#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const upstreamInterface = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const upstreamRuntime = read('packages/core/src/types/upstream/requestTypeDerivationAssessmentIntegrityRuntime.ts');
const executor = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts');
const checks = [
  ['canonical pipeline owns assessment integrity validation', /export interface RequestTypeDerivationSemanticPipelineInterface<[\s\S]*?readonly validateAssessment:\s*\([\s\S]*?RequestTypeDerivationSemanticAssessmentIntegrityResult/.test(upstreamInterface)],
  ['integrity result is a closed discriminated union', /export type RequestTypeDerivationSemanticAssessmentIntegrityResult\s*=\s*\| Readonly<\{ readonly kind: 'assessment_integrity_valid' \}>\s*\| Readonly<\{[\s\S]*?readonly kind: 'assessment_integrity_invalid'/.test(upstreamInterface)],
  ['upstream implementation owns proof-rule coherence checks', /validateRequestTypeDerivationSemanticAssessment/.test(upstreamRuntime) && /closed_derivation_with_complete_verification/.test(upstreamRuntime)],
  ['upstream validator can be bound to pipeline contract', /createRequestTypeDerivationSemanticAssessmentValidator/.test(upstreamRuntime)],
  ['executor delegates semantic assessment integrity to interface', /pipeline\.validateAssessment\(assessment\)/.test(executor)],
  ['executor no longer contains duplicated semantic rule switch', !executor.includes('closed_derivation_with_complete_verification') && !executor.includes('assessmentIntegrityFailure')],
  ['executor retains defensive shape validation for untrusted runtime values', /isAssessmentEnvelope/.test(executor) && /assessment_shape_invalid/.test(executor)],
  ['executor retains source-input binding at runtime boundary', /equivalentEvidence\(input, proofInput\)/.test(executor)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !passed;
}
if (failed) process.exitCode = 1;

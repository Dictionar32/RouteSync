const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const executor = fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts'), 'utf8');
const lowering = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts'), 'utf8');
const checks = [
  ['assessment is treated as unknown at runtime boundary', /const rawAssessment: unknown = pipeline\.derive\(input\)/.test(executor)],
  ['nested proof envelope is shape-checked before dereference', /isAssessmentEnvelope\(rawAssessment\)/.test(executor)],
  ['input source domains are checked as arrays', /Array\.isArray\(premises\.input\.routes\)/.test(executor) && /Array\.isArray\(premises\.input\.resources\)/.test(executor) && /Array\.isArray\(premises\.input\.requests\)/.test(executor)],
  ['proof conclusion and assessment discriminant are correlated', /value\.decision\.conclusion === value\.kind/.test(executor)],
  ['malformed envelope has a typed non-projectable result', /kind: 'assessment_shape_invalid'/.test(executor) && /case 'assessment_shape_invalid'/.test(lowering)],
  ['executor still delegates semantic derivation to injected pipeline', /pipeline\.derive\(input\)/.test(executor) && !/aggregateRequestTypeGroups|createDerivationContext|RequestTypeDeriver/.test(executor)],
  ['semantic integrity validation remains separate from shape validation', /assessmentIntegrityFailure\(assessment, pipeline\.contract\)/.test(executor)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;

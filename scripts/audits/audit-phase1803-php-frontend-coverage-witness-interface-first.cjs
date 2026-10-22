#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendValidationAuthorityInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts');
const pipelinePath = path.join(root, 'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts');
const interfaceSource = fs.readFileSync(interfacePath, 'utf8');
const authoritySource = fs.readFileSync(authorityPath, 'utf8');
const pipelineSource = fs.readFileSync(pipelinePath, 'utf8');
const checks = [
  ['frontend extraction validation contract advanced to v6', /version: 6/.test(interfaceSource) && /traversal-source-mismatch/.test(interfaceSource)],
  ['coverage source file mismatch has a typed violation', /coverage-source-file-mismatch/.test(interfaceSource)],
  ['coverage source span mismatch has a typed violation', /coverage-source-mismatch/.test(interfaceSource)],
  ['complete coverage obligations must be validated', /complete-coverage-obligations-incomplete/.test(interfaceSource)],
  ['incomplete coverage requires missing evidence', /incomplete-coverage-without-missing-evidence/.test(interfaceSource)],
  ['coverage source file is bound to extraction source file', /sameFile\(extraction\.coverage\.sourceFile, sourceFile\)/.test(authoritySource)],
  ['coverage source span is bound to whole-file source span', /sameSpan\(extraction\.coverage\.source, source\)/.test(authoritySource)],
  ['complete coverage obligation list is checked against required tuple', /completeCoverageObligations\.some/.test(authoritySource) && /obligations\[index\]/.test(authoritySource)],
  ['empty missing-evidence list is rejected', /missingEvidence\.length === 0/.test(authoritySource)],
  ['coverage validation runs before source inventory inspection', pipelineSource.indexOf('extractionValidation.validate') < pipelineSource.indexOf('sourceInventory.inspect')],
  ['incomplete frontend coverage remains a blocked pipeline result', /stage: 'frontend_coverage'/.test(pipelineSource)],
  ['new authority avoids semantic foundation and relations dependencies', !/semantic\/(foundation|relations)/.test(authoritySource)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;

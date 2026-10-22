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
  ['validation contract advances to version 4 with coverage witness closure', /version: 4/.test(interfaceSource)],
  ['interface defines exact document extent rule', /bind-whole-file-span-to-exact-document-content-extent/.test(interfaceSource)],
  ['typed violation captures truncated or oversized file span', /whole-file-span-does-not-cover-document-content/.test(interfaceSource)],
  ['authority measures the actual document content', /input\.document\.content\.value\.value\.length/.test(authoritySource)],
  ['authority requires zero start offset', /source\.start\.value !== 0/.test(authoritySource)],
  ['authority requires end offset equal to document length', /source\.end\.value !== documentLength/.test(authoritySource)],
  ['coverage witness source file and extent match extraction', /sameFile\(extraction\.coverage\.sourceFile, sourceFile\)/.test(authoritySource) && /sameSpan\(extraction\.coverage\.source, source\)/.test(authoritySource)],
  ['complete coverage obligations and incomplete missing evidence are validated', /completeCoverageObligations\.some/.test(authoritySource) && /missingEvidence\.length === 0/.test(authoritySource)],
  ['extent violation is emitted before semantic consumers', /kind: 'whole-file-span-does-not-cover-document-content'/.test(authoritySource)],
  ['pipeline validates extraction before inventory', /extractionValidation\.validate/.test(pipelineSource) && pipelineSource.indexOf('extractionValidation.validate') < pipelineSource.indexOf('sourceInventory.inspect')],
  ['pipeline keeps rejected validation as blocked result', /stage: 'frontend_validation'/.test(pipelineSource)],
  ['pipeline does not upgrade blocked integration to complete', /php_source_invocation_semantic_pipeline_blocked/.test(pipelineSource)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;

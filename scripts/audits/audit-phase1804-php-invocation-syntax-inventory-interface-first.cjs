#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const frontendPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const validationInterfacePath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendValidationAuthorityInterface.ts');
const validationAuthorityPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts');
const pipelineAuthorityPath = path.join(root, 'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts');
const frontend = fs.readFileSync(frontendPath, 'utf8');
const validationInterface = fs.readFileSync(validationInterfacePath, 'utf8');
const validationAuthority = fs.readFileSync(validationAuthorityPath, 'utf8');
const pipelineAuthority = fs.readFileSync(pipelineAuthorityPath, 'utf8');
const checks = [
  ['frontend contract evolved to version 4 with independent inventory closure', /version: 4/.test(frontend) && /PhpSourceFrontendTraversalEvidence/.test(frontend)],
  ['raw invocation array replaced with typed invocationInventory', /readonly invocationInventory: PhpSourceInvocationSyntaxInventory/.test(frontend) && !/readonly invocations:/.test(frontend)],
  ['invocation inventory is a closed complete/incomplete union', /php_source_invocation_syntax_inventory_complete/.test(frontend) && /php_source_invocation_syntax_inventory_incomplete/.test(frontend)],
  ['complete invocation inventory declares all three obligations', /all-function-invocation-nodes-inventoried/.test(frontend) && /all-invocation-argument-lists-captured/.test(frontend) && /all-callee-syntax-preserved-before-name-resolution/.test(frontend)],
  ['incomplete invocation inventory must name missing evidence', /missingEvidence: readonly PhpSourceInvocationSyntaxInventoryObligation\[\]/.test(frontend)],
  ['validation contract evolved to version 6 with independent inventory closure', /version: 6/.test(validationInterface) && /complete-coverage-with-partial-parser-traversal/.test(validationInterface)],
  ['typed violation exists for invocation inventory source mismatch', /invocation-inventory-source-mismatch/.test(validationInterface)],
  ['complete coverage cannot pair with incomplete invocation inventory', /complete-coverage-with-incomplete-invocation-inventory/.test(validationInterface)],
  ['validator binds invocation inventory to same file and full source span', /sameFile\(extraction\.invocationInventory\.sourceFile, sourceFile\)/.test(validationAuthority) && /sameSpan\(extraction\.invocationInventory\.source, source\)/.test(validationAuthority)],
  ['validator checks complete invocation inventory obligations', /invocation-inventory-obligations-incomplete/.test(validationAuthority) && /all-callee-syntax-preserved-before-name-resolution/.test(validationAuthority)],
  ['validator rejects incomplete inventory with no missing evidence', /incomplete-invocation-inventory-without-missing-evidence/.test(validationAuthority)],
  ['validator checks every invocation entry span against whole-file source', /extraction\.invocationInventory\.entries\.forEach/.test(validationAuthority) && /callee-syntax-outside-whole-file-span/.test(validationAuthority)],
  ['validated completeness requires complete invocation inventory', /extraction\.invocationInventory\.kind === 'php_source_invocation_syntax_inventory_complete'/.test(validationAuthority)],
  ['pipeline consumes entries only through invocation inventory', /for \(const invocation of invocationSyntaxInventory\.entries\)/.test(pipelineAuthority) && !/extraction\.invocations/.test(pipelineAuthority)],
  ['incomplete inventory remains blocked before invocation judgments', /case 'php_source_invocation_syntax_inventory_incomplete':\s*return blocked\(incompleteCoverage\(document, validation\)\)/.test(pipelineAuthority)],
  ['frontend and validation authorities do not depend on semantic foundation or relations', !/semantic\/(foundation|relations)/.test(validationAuthority) && !/semantic\/(foundation|relations)/.test(validationInterface)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;

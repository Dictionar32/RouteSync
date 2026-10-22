#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = [
  ['existing resolution interface is evolved in place', source.includes('export interface PhpFunctionNameResolutionAuthorityInterface') && source.includes('readonly contract: PhpFunctionNameResolutionContract;')],
  ['resolution contract is versioned', source.includes("readonly version: 1;") && source.includes("kind: 'php_function_name_resolution_contract'")],
  ['malformed evidence has explicit precedence', source.includes("'reject-malformed-name-evidence'")],
  ['environment completeness is a required rule', source.includes("'require-complete-source-environment'")],
  ['fully-qualified identity is preserved', source.includes("'preserve-fully-qualified-name-identity'")],
  ['function import alias is resolved before namespace prefixing', source.includes("'apply-function-import-alias-before-namespace-prefixing'")],
  ['qualified names resolve through alias or namespace', source.includes("'resolve-qualified-name-through-import-prefix-or-current-namespace'")],
  ['known namespace declaration has precedence', source.includes("'prefer-known-namespaced-declaration'")],
  ['runtime fallback retains namespace and global candidates', source.includes('readonly namespaceCandidate: PhpQualifiedFunctionName;') && source.includes('readonly globalFallbackCandidate: PhpQualifiedFunctionName;')],
  ['deferred judgment does not assert target existence', source.includes('runtime-fallback-retains-both-namespaced-and-global-candidates-without-asserting-either-exists')],
  ['downstream projection ownership is explicit', source.includes('invocation-judgment-consumes-this-resolution-and-ast-projection-does-not-repeat-name-resolution')],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;

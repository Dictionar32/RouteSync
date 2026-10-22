const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const authority = fs.readFileSync(authorityPath, 'utf8');
const checks = [
  ['namespace import has a distinct domain binding', /interface PhpNamespaceImportBinding/.test(source)],
  ['namespace import inventory is distinct from function imports', /interface PhpNamespaceImportBinding[\s\S]*?export type PhpNamespaceImports[\s\S]*?kind: 'php_namespace_imports'[\s\S]*?export type PhpFunctionImports/.test(source)],
  ['both global and namespaced scopes own namespace-prefix imports', (source.match(/readonly namespaceImports: PhpNamespaceImports/g) ?? []).length === 2],
  ['completeness witness includes namespace-prefix import inventory', /'namespace-prefix-imports-inventoried'/.test(source)],
  ['resolution contract is version 5', /kind: 'php_function_name_resolution_contract';\s*readonly version: 5/.test(source) && /kind: 'php_function_name_resolution_contract',[\s\S]*?version: 5/.test(source)],
  ['contract separates function import and namespace-prefix import rules', /apply-function-import-alias-before-namespace-prefixing/.test(source) && /apply-namespace-prefix-import-to-qualified-leading-segment/.test(source) && !/apply-qualified-import-alias-to-leading-segment-only/.test(source)],
  ['function imports are used only in unqualified resolution branch', /const alias = imports\.filter/.test(authority) && /if \(syntax\.kind === 'unqualified_function_name_evidence'\)[\s\S]*?const alias = imports\.filter/.test(authority)],
  ['qualified resolution uses namespace-prefix imports', /const namespaceAliases = scopeNamespaceImports\(input\)\.filter/.test(authority)],
  ['fully qualified names return before any import-table lookup', /if \(syntax\.kind === 'fully_qualified_function_name_evidence'\)[\s\S]*?return resolveCanonicalTarget\(input, identity, source, 'qualified-source-name'\);[\s\S]*?if \(syntax\.kind === 'unqualified_function_name_evidence'\)/.test(authority)],
  ['namespace-import source spans participate in source-file binding', /scope\.namespaceImports\.items\.map\(binding => binding\.source\)/.test(authority)],
  ['no semantic/foundation or semantic/relations dependency added to name-resolution authority', !/semantic\/(foundation|relations)/.test(authority)],
];
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}
const failures = checks.filter(([, passed]) => !passed);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length > 0) process.exitCode = 1;

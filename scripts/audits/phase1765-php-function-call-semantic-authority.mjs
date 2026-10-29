import { readFileSync } from 'node:fs';

const files = {
  contract: 'packages/core/src/types/upstream/phpFunctionCallSemanticAuthorityInterface.ts',
  authority: 'packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts',
  mapper: 'packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts',
  barrel: 'packages/core/src/types/upstream/index.ts',
  invocation: 'packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts',
  scannerAst: 'packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));
const checks = [
  ['upstream authority interface exists', source.contract.includes('interface PhpFunctionCallSemanticAuthorityInterface')],
  ['contract accepts typed function-call evidence', source.contract.includes("kind: 'php_function_call_evidence'") && source.contract.includes('readonly function: FunctionName')],
  ['contract returns a closed expression judgment', source.contract.includes("Extract<Expression, { readonly kind: 'builtin' | 'call' }>")],
  ['contract exposes derive, not lookup', source.contract.includes('readonly derive:') && !source.contract.includes('lookup')],
  ['authority owns the name-to-builtin relation', source.authority.includes('const bindings: readonly PhpBuiltinFunctionSemanticBinding[]')],
  ['authority returns complete builtin or call expression', source.authority.includes("kind: 'call', function: input.function") && source.authority.includes("kind: 'builtin', function: binding[1]")],
  ['scanner delegates function-call judgment to authority', source.mapper.includes('phpFunctionCallSemanticAuthority.derive(')],
  ['scanner no longer imports builtin catalog lookup', !source.mapper.includes('phpBuiltinFunctionSemanticCatalog') && !source.mapper.includes('matchLookup')],
  ['old catalog exports are removed from upstream barrel', !source.barrel.includes('phpBuiltinFunctionSemanticCatalog')],
  ['upstream barrel exports the new authority', source.barrel.includes('phpFunctionCallSemanticAuthorityInterface') && source.barrel.includes('phpFunctionCallSemanticAuthority')],
  ['integrated invocation response remains direct publication result', source.invocation.includes('type InvocationSemanticIntegratedResponse = InvocationSemanticCoveragePublicationResult')],
  ['scanner AST retains one integrated invocation response field', source.scannerAst.includes('invocationSemanticIntegratedResponse') && !source.scannerAst.includes('invocationSemanticAnalysisProjection')],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
const bindingCount = (source.authority.match(/binding\('/g) ?? []).length;
const uniqueNames = new Set([...source.authority.matchAll(/binding\('([^']+)'/g)].map(match => match[1]));
const allNamesUnique = bindingCount === uniqueNames.size;
process.stdout.write(`${allNamesUnique ? 'PASS' : 'FAIL'} ${bindingCount} builtin bindings are unique\n`);
failures += Number(!allNamesUnique);
process.stdout.write(`RESULT ${checks.length + 1 - failures}/${checks.length + 1}\n`);
process.exitCode = failures === 0 ? 0 : 1;

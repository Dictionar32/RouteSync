import { readFileSync } from 'node:fs';

const paths = {
  contract: 'packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts',
  barrel: 'packages/core/src/types/upstream/index.ts',
  functionAuthority: 'packages/core/src/types/upstream/phpFunctionCallSemanticAuthorityInterface.ts',
  mapper: 'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts',
  invocationContract: 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts',
  integratedResponse: 'packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts',
  scannerDataflow: 'packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts',
};
const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, 'utf8')]));
const checks = [
  ['resolution contract is upstream-owned', source.contract.includes('interface PhpFunctionNameResolutionAuthorityInterface')],
  ['name syntax distinguishes unqualified, qualified, and fully-qualified references', ['unqualified_function_name', 'qualified_function_name', 'fully_qualified_function_name'].every(tag => source.contract.includes(tag))],
  ['scope distinguishes global from namespaced context', source.contract.includes('global_function_scope') && source.contract.includes('namespaced_function_scope')],
  ['imports and declared functions retain typed source evidence', source.contract.includes('PhpFunctionImportBinding') && source.contract.includes('PhpDeclaredFunctionSymbol') && source.contract.includes('SourceSpan')],
  ['judgment closes resolved, ambiguous, and unresolved outcomes', ['function_name_resolved', 'function_name_ambiguous', 'function_name_unresolved'].every(tag => source.contract.includes(tag))],
  ['resolved target distinguishes builtin, declared, and external functions', ['resolved_builtin_function', 'resolved_declared_function', 'resolved_external_function'].every(tag => source.contract.includes(tag))],
  ['interface does not import scanner AST types', !source.contract.includes('compiler/scanner') && !source.contract.includes('PhpAstValue')],
  ['new interface is exported from upstream barrel', source.barrel.includes("export * from './phpFunctionNameResolutionInterface';")],
  ['function-call authority still exposes its traced short-name limitation', source.functionAuthority.includes('readonly function: FunctionName')],
  ['Laravel mapper still has no scope/import/declaration evidence', source.mapper.includes('functionName(name)') && !source.mapper.includes('PhpFunctionNameResolutionAuthorityInterface')],
  ['invocation judgment remains authority-owned', source.invocationContract.includes('interface InvocationSemanticAuthorityInterface') && source.invocationContract.includes('readonly analyze: (input: InvocationSemanticInput) => InvocationSemanticJudgment')],
  ['integrated response remains the publication result', source.integratedResponse.includes('type InvocationSemanticIntegratedResponse = InvocationSemanticCoveragePublicationResult')],
  ['scanner still delegates atomic integrated response composition', source.scannerDataflow.includes('invocationSemanticIntegratedResponseComposition.integrate({ knowledge: semanticKnowledgeDataFlow })')],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;

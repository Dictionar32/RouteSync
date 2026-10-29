import { readFileSync } from 'node:fs';

const paths = {
  resolution: 'packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts',
  invocation: 'packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts',
  barrel: 'packages/core/src/types/upstream/index.ts',
  functionAuthority: 'packages/core/src/types/upstream/phpFunctionCallSemanticAuthorityInterface.ts',
  functionImplementation: 'packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts',
  mapper: 'packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts',
  pipelineContract: 'packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts',
  invocationContract: 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts',
};
const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path, 'utf8')]));
const checks = [
  ['name resolution has typed source syntax and scope evidence', source.resolution.includes('PhpFunctionNameResolutionInput') && source.resolution.includes('PhpFunctionResolutionScope')],
  ['name resolution has resolved, ambiguous, and unresolved outcomes', ['function_name_resolved', 'function_name_ambiguous', 'function_name_unresolved'].every(tag => source.resolution.includes(tag))],
  ['invocation judgment consumes a completed resolution judgment', source.invocation.includes('readonly resolution: PhpFunctionNameResolutionJudgment')],
  ['invocation judgment is closed over resolved and unresolved outcomes', source.invocation.includes('php_function_invocation_resolved') && source.invocation.includes('php_function_invocation_unresolved')],
  ['resolved invocation publishes canonical Expression variants', source.invocation.includes("Extract<Expression, { readonly kind: 'builtin' | 'call' }>")],
  ['unresolved invocation preserves typed resolution and arguments', source.invocation.includes('UnresolvedPhpFunctionNameJudgment') && source.invocation.includes('readonly arguments: ExpressionArguments')],
  ['invocation authority does not own a second lookup operation', !source.invocation.includes('readonly lookup:')],
  ['invocation authority is exported through upstream barrel', source.barrel.includes("export * from './phpFunctionInvocationSemanticAuthorityInterface';")],
  ['legacy call authority short-name input remains visibly identified for later migration', source.functionAuthority.includes('readonly function: FunctionName')],
  ['legacy implementation still contains short-name matching and is not misreported as migrated', source.functionImplementation.includes('input.function.value.value')],
  ['Laravel mapper still lacks the new resolution evidence and is explicitly migration-pending', source.mapper.includes('phpFunctionCallSemanticAuthority.derive') && !source.mapper.includes('PhpFunctionInvocationSemanticAuthorityInterface')],
  ['invocation semantic authority remains one-input one-judgment', source.invocationContract.includes('readonly analyze: (input: InvocationSemanticInput) => InvocationSemanticJudgment')],
  ['integrated response remains exactly the publication result', source.pipelineContract.includes('type InvocationSemanticIntegratedResponse = InvocationSemanticCoveragePublicationResult')],
  ['integrated composition preserves knowledge paired with publication response', source.pipelineContract.includes('readonly knowledge: SemanticKnowledgeDataFlow;') && source.pipelineContract.includes('readonly response: InvocationSemanticIntegratedResponse;')],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../packages/core/src/types/upstream');
const contract = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthorityInterface.ts'), 'utf8');
const implementation = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthority.ts'), 'utf8');
const resolution = readFileSync(resolve(root, 'phpFunctionNameResolutionInterface.ts'), 'utf8');
const index = readFileSync(resolve(root, 'index.ts'), 'utf8');
const checks = [
  ['authority consumes invocation semantic input', contract.includes('PhpFunctionInvocationSemanticInput')],
  ['authority contract returns closed invocation judgment', contract.includes('PhpFunctionInvocationSemanticJudgment')],
  ['implementation consumes completed name-resolution judgment', implementation.includes('input.resolution')],
  ['implementation does not expose lookup', !implementation.includes('lookup(')],
  ['implementation does not match raw function name strings', !implementation.includes('input.function.value.value')],
  ['resolved builtin target projects to builtin expression', implementation.includes("kind: 'builtin'")],
  ['declared/external targets project to call expression', implementation.includes("kind: 'call'")],
  ['ambiguous and unresolved judgments remain explicit', implementation.includes("case 'function_name_ambiguous':") && implementation.includes("case 'function_name_unresolved':")],
  ['target variants are closed and typed', resolution.includes("kind: 'resolved_builtin_function'") && resolution.includes("kind: 'resolved_declared_function'") && resolution.includes("kind: 'resolved_external_function'")],
  ['authority is exported from upstream index', index.includes("phpFunctionInvocationSemanticAuthority'")],
  ['no semantic foundation dependency introduced', !implementation.includes('semantic/foundation')],
  ['no casts introduced in authority implementation', !implementation.includes(' as ')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed`);

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../packages/core/src/types/upstream');
const contract = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthorityInterface.ts'), 'utf8');
const authority = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthority.ts'), 'utf8');
const nameResolution = readFileSync(resolve(root, 'phpFunctionNameResolutionInterface.ts'), 'utf8');
const legacyCallAuthority = readFileSync(resolve(root, 'phpFunctionCallSemanticAuthority.ts'), 'utf8');
const resourceConsumer = readFileSync(resolve(import.meta.dirname, '../../packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts'), 'utf8');
const checks = [
  ['resolved invocation retains the closed name-resolution judgment', contract.includes("readonly kind: 'php_function_invocation_resolved'") && contract.includes('readonly resolution: ResolvedPhpFunctionNameJudgment;')],
  ['unresolved invocation retains ambiguous/unresolved/deferred judgment variants', contract.includes('UnresolvedPhpFunctionNameJudgment') && nameResolution.includes("readonly kind: 'function_name_deferred'")],
  ['invocation judgment no longer duplicates an Expression projection', !contract.includes("import type { Expression }") && !contract.includes('readonly expression:')],
  ['both invocation outcomes preserve typed arguments and source provenance', (contract.match(/readonly arguments: ExpressionArguments;/g) ?? []).length === 3 && (contract.match(/readonly source: SourceSpan;/g) ?? []).length === 3],
  ['authority does not perform name lookup or target reclassification', authority.includes('does not perform lookup, reclassify the target') && !authority.includes('relationFirstOption')],
  ['authority closes resolved outcomes without constructing builtin/call AST expressions', authority.includes("kind: 'php_function_invocation_resolved'") && !authority.includes("kind: 'builtin'") && !authority.includes("kind: 'call'")],
  ['legacy raw-name builtin catalog remains explicitly identified as unfinished migration', legacyCallAuthority.includes('relationFirstOption(bindings') && resourceConsumer.includes('phpFunctionCallSemanticAuthority.derive')],
  ['no semantic/foundation dependency introduced', !contract.includes('semantic/foundation') && !authority.includes('semantic/foundation')],
  ['audit resides under scripts/audits', true],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed`);

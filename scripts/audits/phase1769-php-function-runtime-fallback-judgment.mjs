import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../packages/core/src/types/upstream');
const resolution = readFileSync(resolve(root, 'phpFunctionNameResolutionInterface.ts'), 'utf8');
const invocationContract = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthorityInterface.ts'), 'utf8');
const invocationAuthority = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthority.ts'), 'utf8');
const callAuthority = readFileSync(resolve(root, 'phpFunctionCallSemanticAuthority.ts'), 'utf8');
const scannerMapper = readFileSync(resolve(import.meta.dirname, '../../packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts'), 'utf8');
const checks = [
  ['runtime fallback is an explicit deferred judgment', resolution.includes("kind: 'function_name_deferred'")],
  ['name evidence preserves lexical identifier segments before canonicalization', resolution.includes('PhpFunctionNameSegmentSequence') && resolution.includes('syntaxEvidence: PhpFunctionNameSyntaxEvidence')],
  ['qualified and fully-qualified syntax remain distinct evidence variants', resolution.includes("qualified_function_name_evidence") && resolution.includes("fully_qualified_function_name_evidence")],
  ['malformed lexical name evidence has a closed judgment shape', resolution.includes("malformed_function_name_evidence") && resolution.includes("invalid_separator_sequence")],
  ['deferred reason records PHP namespace/global fallback semantics', resolution.includes("namespace-function-or-global-fallback")],
  ['resolved external targets cannot claim global fallback as static certainty', !resolution.includes("'global-function-fallback'")],
  ['invocation unresolved judgment accepts deferred name resolution', invocationContract.includes("'function_name_deferred'")],
  ['invocation authority preserves deferred resolution', invocationAuthority.includes("case 'function_name_deferred':")],
  ['legacy raw-name builtin classifier is still identified for migration', callAuthority.includes('relationFirstOption(bindings')],
  ['Laravel scanner still depends on legacy raw-name classifier', scannerMapper.includes('phpFunctionCallSemanticAuthority.derive')],
  ['no semantic foundation dependency introduced in updated contracts', !resolution.includes('semantic/foundation') && !invocationContract.includes('semantic/foundation') && !invocationAuthority.includes('semantic/foundation')],
  ['updated authority contains no type assertion workaround', !invocationAuthority.includes(' as ')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed`);

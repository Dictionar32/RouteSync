import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../packages/core/src/types/upstream');
const resolution = readFileSync(resolve(root, 'phpFunctionNameResolutionInterface.ts'), 'utf8');
const invocation = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthorityInterface.ts'), 'utf8');
const scanner = readFileSync(resolve(import.meta.dirname, '../../packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionCanonical.ts'), 'utf8');
const checks = [
  ['source syntax evidence is a distinct ADT', resolution.includes('export type PhpFunctionNameSyntaxEvidence')],
  ['segments preserve lexical identity and provenance', resolution.includes('interface PhpFunctionNameSegment') && resolution.includes('readonly source: SourceSpan')],
  ['qualified names retain a non-empty segment sequence', resolution.includes('type PhpFunctionNameSegmentSequence = readonly [')],
  ['unqualified names have a dedicated evidence variant', resolution.includes("kind: 'unqualified_function_name_evidence'")],
  ['qualified and fully-qualified names remain distinct', resolution.includes("kind: 'qualified_function_name_evidence'") && resolution.includes("kind: 'fully_qualified_function_name_evidence'")],
  ['malformed syntax remains explicit', resolution.includes("kind: 'malformed_function_name_evidence'")],
  ['resolution input requires syntax evidence, not canonical syntax', resolution.includes('syntaxEvidence: PhpFunctionNameSyntaxEvidence') && !resolution.includes('readonly syntax: PhpFunctionNameSyntax;')],
  ['invocation judgment continues to consume name-resolution judgment', invocation.includes('resolution: PhpFunctionNameResolutionJudgment')],
  ['legacy Laravel raw-name classifier is transparently marked as remaining work', scanner.includes('phpFunctionCallSemanticAuthority.derive')],
  ['no semantic foundation dependency added to the contract', !resolution.includes('semantic/foundation')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed`);

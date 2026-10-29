import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../../packages/core/src/types/upstream');
const resolution = readFileSync(resolve(root, 'phpFunctionNameResolutionInterface.ts'), 'utf8');
const invocation = readFileSync(resolve(root, 'phpFunctionInvocationSemanticAuthorityInterface.ts'), 'utf8');
const scanner = readFileSync(resolve(import.meta.dirname, '../../packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts'), 'utf8');
const checks = [
  ['environment completeness has a named witness', resolution.includes('PhpFunctionResolutionEnvironmentCompletenessWitness') && resolution.includes("kind: 'php_function_resolution_environment_complete'")],
  ['completeness witness ties to source file and source span', resolution.includes('readonly sourceFile: SourceFile') && resolution.includes('readonly source: SourceSpan')],
  ['environment distinguishes complete from incomplete evidence', resolution.includes("kind: 'complete_function_resolution_environment'") && resolution.includes("kind: 'incomplete_function_resolution_environment'")],
  ['incomplete environment records missing evidence obligations', resolution.includes('missingEvidence: readonly PhpFunctionResolutionEvidenceObligation[]') && resolution.includes("'function-imports'")],
  ['resolution input consumes an explicit environment judgment', resolution.includes('environment: PhpFunctionResolutionEnvironmentJudgment')],
  ['resolution input no longer treats a bare scope as complete evidence', !resolution.slice(resolution.indexOf('export interface PhpFunctionNameResolutionInput'), resolution.indexOf('export type PhpFunctionResolutionTarget')).includes('readonly scope: PhpFunctionResolutionScope;')],
  ['syntax evidence retains qualified-name distinctions', resolution.includes("kind: 'qualified_function_name_evidence'") && resolution.includes("kind: 'fully_qualified_function_name_evidence'")],
  ['invocation authority still consumes the closed resolution judgment', invocation.includes('resolution: PhpFunctionNameResolutionJudgment')],
  ['Laravel raw-name mapper is not falsely reported as migrated', scanner.includes('phpFunctionCallSemanticAuthority.derive')],
  ['contract avoids semantic/foundation dependency', !resolution.includes('semantic/foundation')],
  ['public upstream barrel exports the resolution contract', readFileSync(resolve(root, 'index.ts'), 'utf8').includes("export * from './phpFunctionNameResolutionInterface'")],
  ['legacy name-only authority remains visible for follow-up migration', readFileSync(resolve(root, 'phpFunctionCallSemanticAuthorityInterface.ts'), 'utf8').includes('PhpFunctionCallSemanticInput')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} static checks passed`);

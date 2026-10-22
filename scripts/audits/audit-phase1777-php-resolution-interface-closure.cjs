const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const resolutionPath = path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const invocationPath = path.join(root, 'packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const callAuthorityPath = path.join(root, 'packages/core/src/types/upstream/phpFunctionCallSemanticAuthority.ts');
const pipelinePath = path.join(root, 'packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const resolution = fs.readFileSync(resolutionPath, 'utf8');
const invocation = fs.readFileSync(invocationPath, 'utf8');
const callAuthority = fs.readFileSync(callAuthorityPath, 'utf8');
const pipeline = fs.readFileSync(pipelinePath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['resolution interface has no semantic/relations dependency', !resolution.includes('semantic/relations')],
  ['resolution interface has no semantic/foundation dependency', !resolution.includes('semantic/foundation')],
  ['rule contract closes qualified-import alias behavior', resolution.includes('apply-qualified-import-alias-to-leading-segment-only')],
  ['rule contract forbids short-name-only target inference', resolution.includes('never-infer-function-target-from-short-name-alone')],
  ['builtin identity requires canonical global identity', resolution.includes('builtin-target-requires-canonical-global-function-identity-and-never-a-matching-short-name-alone')],
  ['deferred judgment retains namespaced candidate', resolution.includes('readonly namespaceCandidate: PhpQualifiedFunctionName;')],
  ['deferred judgment retains global fallback candidate', resolution.includes('readonly globalFallbackCandidate: PhpQualifiedFunctionName;')],
  ['invocation judgment consumes name-resolution judgment', invocation.includes('readonly resolution: PhpFunctionNameResolutionJudgment;')],
  ['invocation judgment keeps resolved and unresolved outcomes closed', invocation.includes("kind: 'php_function_invocation_resolved'") && invocation.includes("kind: 'php_function_invocation_unresolved'")],
  ['integrated response composition contract exists', pipeline.includes('interface InvocationSemanticIntegratedResponseCompositionInterface')],
  ['Laravel scanner consumes integrated response composition', scanner.includes('invocationSemanticIntegratedResponseComposition.integrate')],
  ['trace exposes raw-name classifier as a migration blocker', callAuthority.includes('input.function.value.value') && callAuthority.includes('relationFirstOption')],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;

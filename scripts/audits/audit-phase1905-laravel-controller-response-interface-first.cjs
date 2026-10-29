const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const compositionInterface = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const compositionRuntime = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');

check('composition interface declares source-outcome identity separately from composed aggregate',
  compositionInterface.includes('readonly sourceOutcomePreservation:') &&
  compositionInterface.includes('composition-retains-the-exact-phpSourceInvocationPipeline-input-as-phpFunctionInvocations') &&
  compositionInterface.includes('version: 18'));
check('Laravel boundary version advances and corrects response ownership semantics',
  boundary.includes('readonly version: 72') && boundary.includes('version: 72') &&
  boundary.includes('knowledge-bound-publication-composition-retains-that-same-outcome-as-phpFunctionInvocations') &&
  !boundary.includes('integrated-response-is-the-exact-response-nested-in-the-canonical-invocation-judgment'));
check('analyzer depends on the upstream composition interface rather than importing its concrete singleton',
  analyzer.includes('InvocationSemanticIntegratedResponseCompositionInterface') &&
  analyzer.includes('responseComposition.integrate(') &&
  !analyzer.includes("from '../../../types/upstream/invocationSemanticPipeline'"));
check('composition executor forwards the exact source outcome into the aggregate',
  compositionRuntime.includes('phpFunctionInvocations: input.phpSourceInvocationPipeline') &&
  compositionRuntime.includes('knowledge: input.knowledge') &&
  compositionRuntime.includes('response,') );
check('composition singleton is bound at the scanner wiring root',
  wiring.includes("import { invocationSemanticIntegratedResponseComposition } from '../../../types/upstream/invocationSemanticPipeline'") &&
  wiring.includes('judgment,\n  invocationSemanticIntegratedResponseComposition,'));
check('analyzer does not falsely claim to be wiring-only',
  analyzer.includes('Transitional controller dataflow analyzer') &&
  analyzer.includes('still performs semantic work'));
check('runtime semantic work remains explicitly gated instead of being declared solved',
  boundary.includes('controllerDataflowRuntimeReductionGate') &&
  boundary.includes('interface-presence-alone-does-not-claim-completion'));
check('no semantic foundation dependency introduced',
  !compositionInterface.includes('semantic/foundation') &&
  !boundary.includes('semantic/foundation') &&
  !analyzer.includes('semantic/foundation') &&
  !wiring.includes('semantic/foundation') &&
  !compositionRuntime.includes('semantic/foundation'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;

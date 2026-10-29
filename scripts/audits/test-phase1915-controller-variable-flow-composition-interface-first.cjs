const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionAuthority.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const names = read('packages/core/src/types/upstream/names.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');

check('upstream flow-composition contract consumes canonical ControllerVariableDefinition values',
  contract.includes('ControllerVariableFlowCompositionInput') === false &&
  contract.includes('ControllerSemanticVariableFlowCompositionInput') &&
  contract.includes('ControllerVariableDefinition[]') &&
  contract.includes('ControllerSemanticVariableFlowCompositionJudgment'));
check('closed composition judgment distinguishes empty from populated flow and retains evidence',
  contract.includes("kind: 'controller_semantic_variable_flow_composed'") &&
  contract.includes("kind: 'controller_semantic_variable_flow_empty'") &&
  contract.includes('definitionEvidence'));
check('authority groups by domain VariableName equality rather than a primitive-key index',
  authority.includes('variableNameEquals(binding.variable, definition.variable)') &&
  !authority.includes('RelationIndex<string') &&
  names.includes('export const variableNameEquals'));
check('authority retains definition ordering within each variable group',
  authority.includes('appendDefinition(binding.definitions, definition)') &&
  authority.includes('groupDefinitions(input.definitions)'));
check('analyzer no longer owns canonical variable grouping or sequence builders',
  !analyzer.includes('canonicalSemanticVariables') &&
  !analyzer.includes('sequenceFromCanonicalDefinitions') &&
  !analyzer.includes('relationIndexAdd') &&
  analyzer.includes('variableFlowCompositionAuthority.compose({'));
check('composition authority is connected through the production composition root',
  wiring.includes('controllerSemanticVariableFlowCompositionAuthority') &&
  wiring.includes('phpControllerDataflowSourcePayloadEvidenceAdapter,\n  controllerSemanticVariableFlowCompositionAuthority'));
check('upstream barrel exports the interface and its single authority implementation',
  barrel.includes("export * from './controllerSemanticVariableFlowCompositionInterface'") &&
  barrel.includes("export { controllerSemanticVariableFlowCompositionAuthority } from './controllerSemanticVariableFlowCompositionAuthority'"));
check('scanner boundary contract is bumped and records grouping ownership',
  scannerContract.includes('readonly version: 81;') &&
  scannerContract.includes('  version: 81,') &&
  scannerContract.includes('controllerDataflowVariableFlowCompositionBoundary') &&
  scannerContract.includes('it-still-orchestrates-semantic-resolution'));
check('canonical invocation judgment and integrated response remain separate outputs',
  analyzer.includes('phpSourceInvocationPipeline: judgment.response') &&
  analyzer.includes('invocationSemanticIntegratedResponse') &&
  analyzer.includes('invocationJudgment: judgment'));
check('semantic-resolution ownership is disclosed as remaining analyzer work',
  scannerContract.includes('it-still-orchestrates-semantic-resolution') &&
  analyzer.includes('resolveSemanticForValue') &&
  analyzer.includes('executor.execute('));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;

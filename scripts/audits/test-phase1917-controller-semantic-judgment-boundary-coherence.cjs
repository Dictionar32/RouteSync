const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const model = read('packages/core/src/types/upstream/controller.ts');
const invocationModel = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');

check('scanner boundary interface and exported contract value use the same version 83',
  contract.includes('readonly version: 83;') && contract.includes('  version: 83,'));
check('contract states exact semantic judgment retention and forbids reconstruction or reclassification',
  contract.includes('controllerDataflowSemanticResolutionJudgmentBoundary') &&
  contract.includes('exact-closed-ControllerVariableSemanticJudgment') &&
  contract.includes('never-reconstructed-or-reclassified'));
check('ControllerVariableDefinition retains the closed semantic judgment as a typed field',
  model.includes('readonly semanticResolution: ControllerVariableSemanticJudgment;'));
check('source-projected Expression and semantic judgment expressionValue are documented as distinct representations',
  analyzer.includes('projected source Expression below is a separate domain representation') &&
  contract.includes('judgment-expressionValue-remain-distinct-domain-representations'));
check('semantic judgment comes directly from the existing runtime executor',
  analyzer.includes('const semanticResolution = executor.execute(semanticResolutionInputAdapter.adapt({'));
check('definition stores the same semanticResolution value without reclassification',
  analyzer.includes('semanticResolution,') && !analyzer.includes('reclassifySemanticResolution'));
check('invocation response composition receives the exact judgment response',
  analyzer.includes('phpSourceInvocationPipeline: judgment.response'));
check('invocation judgment and integrated response remain separate model fields',
  analyzer.includes('invocationJudgment: judgment') &&
  analyzer.includes('invocationSemanticIntegratedResponse') &&
  invocationModel.includes('invocationJudgment') && invocationModel.includes('invocationSemanticIntegratedResponse'));
check('existing semantic authority is reused without a parallel authority declaration',
  !contract.includes('ControllerVariableSemanticResolutionAuthorityV2') &&
  analyzer.includes('ControllerVariableSemanticRuntimeExecutorInterface'));
check('remaining analyzer orchestration is explicitly disclosed rather than claimed wiring-only',
  analyzer.includes('still orchestrates knowledge production') &&
  contract.includes('controllerDataflowSemanticResolutionJudgmentBoundary'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;

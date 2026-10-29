const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const ast = read('packages/core/src/compiler/frontend/php/controllerBodyAstTypes.ts');
const parser = read('packages/core/src/compiler/frontend/php/controllerBodyParser.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const modelAuthority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/controller/controllerBodyResolver.ts');
const packageJson = JSON.parse(read('package.json'));

check('body AST variants distinguish syntax-only absence from semantic judgment presence',
  ast.includes("readonly kind: 'controller_body_syntax_only'") &&
  ast.includes("readonly kind: 'controller_body_semantic'") &&
  ast.includes('readonly dataflow: undefined') && ast.includes('readonly dataflow: ControllerDataflowAst'));
check('semantic body documentation explicitly does not claim invocation completion',
  ast.includes('does not imply invocation integration completed') &&
  model.includes('controller_body_semantic-means-the-canonical-dataflow-judgment-is-present-not-that-the-invocation-pipeline-is-complete'));
check('invocation semantic judgment preserves all four discriminated pipeline outcomes',
  invocation.includes("'php_source_invocation_integration_not_connected'") &&
  invocation.includes("'php_source_invocation_integration_source_binding_rejected'") &&
  invocation.includes("'php_source_invocation_integration_complete'") &&
  invocation.includes("'php_source_invocation_integration_blocked'"));
check('upstream dataflow model retains exact invocation judgment and integrated response as separate correlated fields',
  model.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface') &&
  model.includes('readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult') &&
  modelAuthority.includes('phpSourceInvocationPipeline: sourceCorrelation.invocationJudgment.response'));
check('parser emits semantic AST only from the canonical invocation-judgment context without synthesizing a response outcome',
  parser.includes("kind: 'controller_body_semantic'") &&
  parser.includes('dataflow: buildDataflow(parsedBlock, parameterSemantics, projectionJudgment.invocationJudgment)') && parser.includes('laravelControllerAstProjectionSemanticAuthority.judge(context)') &&
  !parser.includes('php_source_invocation_integration_not_connected'));
check('body resolver is typed to consume semantic body AST rather than syntax-only AST',
  resolver.includes('export function resolveControllerBody(body: ControllerBodyAst)') &&
  resolver.includes('dataflow: body.dataflow'));
check('upstream model contract and live contract value agree on version 18 and outcome independence',
  model.includes('readonly version: 18;') && model.includes('  version: 18,') &&
  model.includes('readonly semanticBodyInvocationOutcome:') && model.includes('semanticBodyInvocationOutcome:'));
check('Laravel scanner boundary and live contract value agree on version 109 and outcome preservation',
  scanner.includes('readonly version: 109;') && scanner.includes('  version: 109,') &&
  scanner.includes('readonly controllerBodyInvocationOutcome:') && scanner.includes('controllerBodyInvocationOutcome:'));
check('existing authority remains the sole semantic closure owner',
  model.includes('noParallelAuthority') && scanner.includes('controllerDataflowSemanticOwnership') &&
  !ast.includes('resolveInvocationOutcome') && !parser.includes('reclassifyInvocation'));
check('Phase 1946 audit is registered in package scripts',
  packageJson.scripts['audit:phase1946-controller-body-invocation-outcome-adt'] === 'node scripts/audits/audit-phase1946-controller-body-invocation-outcome-adt.cjs');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const passed = checks.filter((item) => item.passed).length;
const summary = { phase: 1946, audit: 'controller-body-invocation-outcome-adt', passed, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE1946_AUDIT.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;

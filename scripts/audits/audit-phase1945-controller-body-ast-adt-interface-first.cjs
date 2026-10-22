const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const astTypes = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const controllerAstTypes = read('packages/core/src/compiler/scanner/lexer/controllerAstTypes.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const index = read('packages/core/src/compiler/scanner/lexer/index.ts');
const packageJson = JSON.parse(read('package.json'));

check('body AST is an explicit discriminated union rather than a conditional dataflow field',
  astTypes.includes("readonly kind: 'controller_body_syntax_only'") &&
  astTypes.includes("readonly kind: 'controller_body_semantic'") &&
  astTypes.includes('Semantic extends true ? SemanticControllerBodyAst : SyntaxOnlyControllerBodyAst'));
check('syntax-only projection emits its own ADT variant with no dataflow',
  parser.includes("kind: 'controller_body_syntax_only'") &&
  parser.includes('dataflow: undefined'));
check('semantic projection emits its own ADT variant with the analyzed dataflow',
  parser.includes("kind: 'controller_body_semantic'") &&
  parser.includes('dataflow: buildDataflow(parsedBlock, parameterSemantics, projectionJudgment.invocationJudgment)'));
check('parser overloads preserve distinct syntax-only and semantic AST variants',
  parser.includes('ControllerBodyAst<false>') && parser.includes('ControllerBodyAst<true>') &&
  controllerAstTypes.includes('readonly body: ControllerBodyAst<Semantic>'));
check('semantic AST dataflow still retains the existing canonical invocation judgment and integrated response',
  astTypes.includes('readonly dataflow: ControllerDataflowAst') &&
  model.includes('readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult') &&
  model.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface') &&
  authority.includes('invocationSemanticIntegratedResponseComposition.integrate({'));
check('syntax-only absence is explicitly not a not-connected or unresolved invocation outcome',
  scannerContract.includes('absence-of-semantic-analysis-is-not-reclassified-as-not-connected-or-unresolved') &&
  scannerContract.includes('controller_body_syntax_only'));
check('existing semantic model contract version and AST projection contract are synchronized',
  model.includes('readonly version: 18;') && model.includes('  version: 18,') &&
  model.includes('ControllerBodyAst-is-a-discriminated-syntax-only-or-semantic-ADT'));
check('Laravel scanner boundary version and body AST contract are synchronized',
  scannerContract.includes('readonly version: 109;') && scannerContract.includes('  version: 109,') &&
  scannerContract.includes('readonly controllerBodyProjectionAdt:') &&
  scannerContract.includes('controllerBodyProjectionAdt:'));
check('AST ADT variants are exported through the existing lexer barrel',
  index.includes('SyntaxOnlyControllerBodyAst') && index.includes('SemanticControllerBodyAst'));
check('no parallel semantic authority or invocation fallback was added',
  !astTypes.includes('readonly resolvePayload:') &&
  !parser.includes('php_source_invocation_integration_not_connected') &&
  model.includes('noParallelAuthority'));
check('Phase 1945 audit is registered in package scripts',
  packageJson.scripts['audit:phase1945-controller-body-ast-adt-interface-first'] === 'node scripts/audits/audit-phase1945-controller-body-ast-adt-interface-first.cjs');

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const passed = checks.filter((item) => item.passed).length;
const summary = { phase: 1945, audit: 'controller-body-ast-adt-interface-first', passed, total: checks.length, checks };
fs.writeFileSync(path.join(root, 'PHASE1945_AUDIT.json'), `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`RESULT ${passed}/${checks.length}\n`);
if (passed !== checks.length) process.exitCode = 1;

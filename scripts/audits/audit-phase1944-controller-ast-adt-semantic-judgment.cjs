const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const vocabulary = read('packages/core/src/types/upstream/primitiveVocabulary.ts');
const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');

check('AST expression projection matches the closed payload judgment ADT exhaustively',
  scanner.includes("case 'controller_dataflow_payload_semantics_resolved'") &&
  scanner.includes("case 'controller_dataflow_payload_semantics_unresolved'") &&
  scanner.includes("case 'controller_dataflow_payload_semantics_ambiguous'") &&
  scanner.includes('unreachablePayloadJudgment(judgment)'));
check('resolved payload reuses the canonical source expression and semantic result from the same judgment',
  scanner.includes('expression: judgment.bindingJudgment.definition.semanticResolution.sourceExpression') &&
  scanner.includes('result: judgment.bindingJudgment.definition.semanticResolution.expressionValue'));
check('ambiguous payload remains a distinct unresolved semantic value instead of collapsing into external',
  vocabulary.includes("'missing_local_variable' | 'ambiguous'") &&
  scanner.includes("result: { kind: 'unresolved', reason: 'ambiguous' }"));
check('scanner never chooses a candidate from the raw binding judgment array',
  scanner.includes('method.body.dataflow.payloadJudgments') &&
  !scanner.includes('method.body.dataflow.bindingJudgments') &&
  !scanner.includes('resolvedCandidates[0]'));
check('existing semantic model contract declares AST ADT projection and current version consistently',
  model.includes('readonly version: 18;') && model.includes('  version: 18,') &&
  model.includes('readonly astAdtProjection:') && model.includes('astAdtProjection:'));
check('Laravel scanner boundary version and AST ADT declaration are synchronized',
  scannerContract.includes('readonly version: 109;') && scannerContract.includes('  version: 109,') &&
  scannerContract.includes('readonly controllerDataflowAstAdtProjection:') &&
  scannerContract.includes('controllerDataflowAstAdtProjection:'));
check('semantic stage inventory accurately describes evidence collection and existing authority ownership',
  scannerContract.includes('controllerDataflowAnalyzer-collects-source-correlated-knowledge-and-parser-payload-evidence-then-forwards-one-evidence-input-to-ControllerDataflowSemanticJudgmentAuthorityInterface;authority-owns-binding-correspondence-identity-closure-variable-flow-composition-and-integrated-response;injected-PHP-definition-projection-adapter-uses-the-existing-runtime-executor') &&
  !scannerContract.includes('controllerDataflowAnalyzer-delegates-source-payload-traversal-binding-correspondence-expression-projection-and-variable-flow-composition;semantic-request-adaptation-is-owned-by-a-typed-source-adapter;analyzer-still-invokes-the-existing-runtime-executor'));
check('analyzer packages source-correlated evidence and delegates closed semantic judgment derivation',
  analyzer.includes('semanticJudgmentAuthority.derive({') &&
  analyzer.includes('sourceCorrelation:') &&
  authority.includes('invocationSemanticIntegratedResponseComposition.integrate({'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;

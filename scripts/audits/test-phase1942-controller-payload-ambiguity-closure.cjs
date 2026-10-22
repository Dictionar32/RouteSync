const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const model = read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const authorityInterface = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthorityInterface.ts');
const authorityImplementation = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const bodyTypes = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');

check('existing semantic model publishes payload judgments as closed values, not a callable lookup authority',
  model.includes('readonly payloadJudgments: readonly TPayloadJudgment[]') &&
  model.includes("kind: 'controller_dataflow_payload_semantics_resolved'") &&
  model.includes("kind: 'controller_dataflow_payload_semantics_ambiguous'") &&
  !model.includes('readonly resolvePayload:'));
check('upstream authority creates one payload judgment per source payload',
  authority.includes('sourceCorrelation.statementPayloads') &&
  authority.includes('payloadSemanticJudgment(payload, bindingJudgments)') &&
  authority.includes("Object.is(judgment.correspondence.payload, payload)"));
check('duplicate resolved bindings become explicit ambiguity instead of selecting the first match',
  authority.includes('controller_dataflow_payload_semantics_ambiguous') &&
  authority.includes('bindingJudgments: resolvedCandidates') &&
  authority.includes('resolvedCandidates.slice(1)'));
check('scanner consumes only a resolved payload judgment and cannot choose among binding candidates',
  scanner.includes('method.body.dataflow.payloadJudgments') &&
  scanner.includes('judgment.bindingJudgment.definition.semanticResolution') &&
  !scanner.includes('method.body.dataflow.bindingJudgments'));
check('payload judgment is part of the existing ControllerDataflowAst contract',
  bodyTypes.includes("ControllerDataflowAst['payloadJudgments'][number]") &&
  bodyTypes.includes('ControllerDataflowPayloadJudgment'));
check('unresolved and ambiguous payload outcomes do not become resolved semantic values',
  scanner.includes("case 'controller_dataflow_payload_semantics_ambiguous'") &&
  scanner.includes("reason: 'ambiguous'") &&
  scanner.includes("case 'controller_dataflow_payload_semantics_unresolved'"));
check('semantic authority contract version and ambiguity rule are synchronized',
  authorityInterface.includes('readonly contractVersion: 15;') &&
  authorityImplementation.includes('  contractVersion: 15,') &&
  authorityInterface.includes('readonly version: 15;') &&
  authorityInterface.includes('  version: 15,') &&
  authorityInterface.includes('duplicate-resolved-binding-candidates-are-ambiguous-not-first-match-selected'));
check('Laravel scanner boundary version is synchronized',
  scannerContract.includes('readonly version: 109;') &&
  scannerContract.includes('  version: 109,') &&
  scannerContract.includes('duplicate-resolved-bindings-are-published-as-ambiguity-not-first-match-selected'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;

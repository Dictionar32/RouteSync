const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/controllerDataflowSourcePayloadEvidenceAdapterInterface.ts');
const adapter = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');

check('upstream contract is parser-neutral and generic over source evidence',
  contract.includes('ControllerDataflowSourcePayloadEvidenceAdapterInterface<') &&
  contract.includes('ControllerDataflowSourcePayloadEvidenceInput<Source>') &&
  !contract.includes('PhpBlock') && !contract.includes('PhpAstValue'));
check('source adapter emits typed source spans using the canonical judgment source file',
  adapter.includes("kind: 'source_span'") &&
  adapter.includes('file: sourceFile') &&
  adapter.includes('statementIndex: StatementIndex'));
check('source traversal is owned by the PHP AST evidence adapter',
  adapter.includes('const visit = (block: PhpBlock)') &&
  adapter.includes('const exhaustive: never = statement') &&
  !analyzer.includes('const collectStatementPayloads'));
check('analyzer requests payload evidence through the injected interface',
  analyzer.includes('sourcePayloadEvidenceAdapter.collect({') &&
  analyzer.includes('sourceFile: judgment.sourceFile') &&
  !analyzer.includes('const visitAlternative'));
check('composition root injects the PHP source evidence adapter',
  wiring.includes('phpControllerDataflowSourcePayloadEvidenceAdapter') &&
  wiring.includes('controllerDataflowVariableIdentityAuthority,\n  phpControllerDataflowSourcePayloadEvidenceAdapter'));
check('binding correspondence remains a distinct upstream judgment after evidence extraction',
  analyzer.includes('correspondenceAuthority.judge({') &&
  analyzer.includes('bindingPayloadCorrespondence'));
check('canonical invocation judgment and integrated response remain distinct and retained',
  analyzer.includes('phpSourceInvocationPipeline: judgment.response') &&
  analyzer.includes('invocationSemanticIntegratedResponse') &&
  analyzer.includes('invocationJudgment: judgment'));
check('source payload adapter contract is exported by the upstream barrel',
  barrel.includes("export * from './controllerDataflowSourcePayloadEvidenceAdapterInterface'"));
check('scanner boundary contract version and ownership inventory are synchronized',
  scannerContract.includes('readonly version: 80;') &&
  scannerContract.includes("  version: 80,") &&
  scannerContract.includes('controllerDataflowSourcePayloadEvidenceBoundary') &&
  scannerContract.includes('controllerDataflowSourcePayloadAdapterOwnership'));
check('remaining semantic-resolution and grouping work is explicitly disclosed',
  scannerContract.includes('it-still-orchestrates-semantic-resolution-and-variable-grouping') &&
  analyzer.includes('resolveSemanticForValue') &&
  analyzer.includes('canonicalSemanticVariables'));

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`RESULT ${checks.filter((item) => item.passed).length}/${checks.length}\n`);
if (checks.some((item) => !item.passed)) process.exitCode = 1;

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, passed, detail = '') => checks.push({ name, passed: Boolean(passed), detail });

const contractPath = 'packages/core/src/types/upstream/semanticTypeDerivationInterface.ts';
const authorityPath = 'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts';
const executorPath = 'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts';
const runtimePath = 'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntime.ts';
const scannerFacadePath = 'packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts';
const testPath = 'packages/core/src/compiler/semantic/type-derivation/__test__/semanticTypeDerivationRuntimeExecutor.phase1552.test.ts';
const contract = read(contractPath);
const authority = read(authorityPath);
const executor = read(executorPath);
const runtime = read(runtimePath);
const scannerFacade = read(scannerFacadePath);
const test = read(testPath);

check('upstream interface defines typed request, closed judgment, and proof',
  contract.includes('SemanticTypeDerivationRequest')
  && contract.includes('SemanticTypeDerivationJudgment')
  && contract.includes('SemanticTypeDerivationProof')
  && contract.includes("readonly complete: true"));
check('proof carries ordered derivation stages, source coverage, and result count',
  contract.includes("readonly stages: readonly ['resource', 'route_response', 'model']")
  && contract.includes('readonly sourceCoverage:')
  && contract.includes('readonly resultCount: number'));
check('runtime boundary validates closure and proof without semantic re-derivation',
  contract.includes('assertSemanticTypeDerivationJudgment')
  && contract.includes('judgment.proof.resultCount !== judgment.result.length')
  && contract.includes('!coverageMatches'));
check('authority composes the existing resource, route-response, and model derivations',
  authority.includes('deriveResourceTypes(context, seenNames)')
  && authority.includes('deriveRouteResponseTypes(context, seenNames)')
  && authority.includes('deriveModelTypes(context, seenNames)')
  && authority.includes("kind: 'semantic_type_derivation_proof'"));
check('runtime executor delegates to authority then validates the returned contract',
  executor.includes('authority.resolve(request)')
  && executor.includes('assertSemanticTypeDerivationJudgment(request, authority.resolve(request))')
  && !executor.includes('deriveResourceTypes')
  && !executor.includes('deriveModelTypes'));
check('concrete authority composition is outside scanner', exists(runtimePath)
  && runtime.includes('semanticTypeDerivationAuthority')
  && runtime.includes('createSemanticTypeDerivationRuntimeExecutor'));
check('scanner facade consumes executor and does not select the concrete authority',
  scannerFacade.includes("semanticTypeDerivationRuntimeExecutor as executor")
  && !scannerFacade.includes('semanticTypeDerivationAuthority')
  && !scannerFacade.includes('createSemanticTypeDerivationRuntimeExecutor'));
check('tests cover delegation and mismatched source-coverage rejection',
  test.includes('delegates the original request')
  && test.includes('rejects a judgment whose source coverage does not match the request')
  && test.includes('toThrow(/contract violation/)'));

const scannerRoot = path.join(root, 'packages/core/src/compiler/scanner');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const scannerFiles = walk(scannerRoot).filter(file => /\.tsx?$/.test(file));
const testFiles = scannerFiles.filter(file => /(^|[/\\])(__test__|__tests__|tests?)([/\\]|\.)|\.test\.tsx?$/.test(file));
const productionFiles = scannerFiles.filter(file => !testFiles.includes(file));
const directSolverCalls = scannerFiles.flatMap(file => {
  const contents = fs.readFileSync(file, 'utf8');
  return [...contents.matchAll(/\bsolveSemanticRelations(?:Detailed)?\s*\(/g)].map(match => ({
    path: path.relative(root, file).split(path.sep).join('/'),
    line: contents.slice(0, match.index).split('\n').length,
    test: testFiles.includes(file),
  }));
});
const reasoningSignals = scannerFiles.filter(file => /\b(classify|infer|resolve|derive|candidate|precedence|semantic|authority|judgment|relationFold|relationGate)\b/i.test(fs.readFileSync(file, 'utf8')));
const frontiers = [
  { path: 'packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts', owner: 'request-type semantic authority', status: 'open', note: 'Orchestrator still calls derivation aggregation implemented under scanner/subscanners/request-deriver.' },
  { path: 'packages/core/src/compiler/scanner/subscanners/request-deriver/', owner: 'request-type semantic authority', status: 'open', note: 'Action/response/group assembly still mixes domain derivation and descriptor construction.' },
  { path: 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts', owner: 'AST syntax/semantic boundary', status: 'mixed', note: 'Syntax-to-AST construction is expected; domain inference/classification ownership still needs rule-by-rule trace.' },
  { path: 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts', owner: 'upstream request-type interface', status: 'open', note: 'Wiring still calls RequestTypeDeriver directly.' },
  { path: 'packages/core/src/compiler/scanner/', owner: 'route security/CRUD and controller dataflow authorities', status: 'consumer-audit-open', note: 'Existing authorities are present; this inventory does not prove every consumer has cut over.' },
];

const audit = {
  phase: 1553,
  title: 'Interface-first runtime executor proof and scanner ownership trace',
  totals: {
    sourceFiles: scannerFiles.length,
    productionFiles: productionFiles.length,
    testFiles: testFiles.length,
    filesWithReasoningSignals: reasoningSignals.length,
    directSolverCalls: directSolverCalls.length,
    productionDirectSolverCalls: directSolverCalls.filter(item => !item.test).length,
  },
  checks,
  openFrontiers: frontiers,
  directSolverCallSites: directSolverCalls,
};
const outPath = path.join(root, 'PHASE1553_RUNTIME_EXECUTOR_CLOSED_PROOF_AUDIT.json');
fs.writeFileSync(outPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify({ ...audit, checksPassed: checks.filter(item => item.passed).length, checksTotal: checks.length, auditFile: path.relative(root, outPath) }, null, 2));
if (checks.some(item => !item.passed)) process.exitCode = 1;

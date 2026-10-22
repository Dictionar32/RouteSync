const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const checks = [];
const check = (name, ok) => checks.push({ name, passed: Boolean(ok) });

const astContract = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const astAnalysis = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const dataflowAdapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const irProjection = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicCore = read('packages/core/src/index.ts');
const stageContract = read('packages/core/src/types/upstream/astSemanticStageInterface.ts');
const stageAuthority = read('packages/core/src/types/upstream/astSemanticStageAuthority.ts');
const relationSequence = read('packages/core/src/semantic/foundation/relationalSequence.ts');

check('AST-facing contract is non-empty and aliases the canonical semantic dataflow ADT', /AstDataflowJudgment\s*=\s*SemanticDataflowJudgment/.test(astContract));
check('AST consumers receive the read-only DataFlowAuthorityInterface', /AstDataflowInterface\s*=\s*DataFlowAuthorityInterface</.test(astContract));
check('AST analysis consumes AstDataflowInterface instead of spelling generic authority parameters again', /readonly dataflow:\s*AstDataflowInterface/.test(astAnalysis) && !/DataFlowAuthorityInterface<SemanticDataflowInput/.test(astAnalysis));
check('wiring preserves the exact upstream reasoning contract', /reasoning:\s*state\.reasoningContract/.test(dataflowAdapter));
check('semantic closure remains owned by the upstream authority', /export (?:const|function) createSemanticDataflowJudgment/.test(authority));
check('IR reads the closed authority state and does not create semantic closure', /dataflow\.state\.closure/.test(irProjection) && !/createSemanticDataflowJudgment|relationFixedPoint/.test(irProjection));
const flowContract = manifest.match(/export interface RouteSyncManifestFlow[\s\S]*?\n}/)?.[0] ?? '';
check('downstream manifest flow is AST-free and transports semantic contracts', /interface RouteSyncManifestFlow extends ManifestDataflowSeedSurface/.test(flowContract) && !/readonly ast:/.test(flowContract));
check('AST dataflow contract is exported from the upstream type boundary', /export \* from '\.\/astDataflowInterface'/.test(upstreamIndex));
check('AST dataflow contract is exported from the public core package', /export type \{ AstDataflowFact, AstDataflowIdentity, AstDataflowInput, AstDataflowInterface, AstDataflowJudgment \}/.test(publicCore));
check('AST contract contains no duplicate solver or semantic constructor', !/relationFixedPoint|createSemanticDataflowJudgment/.test(astContract));
check('AST stage interface is type-only after authority separation', !/export\s+(?:const|function)\s/.test(stageContract) && !/from ['"]\.\.\/semantic\//.test(stageContract));
check('AST stage runtime construction is isolated in its authority module', /astSemanticStageContract/.test(stageAuthority) && /createAstSemanticStagePort/.test(stageAuthority));
check('relation sequence narrowing uses the closed variant algebra instead of an Extract cast', /relationSequenceToArray[\s\S]*?relationVariantFold/.test(relationSequence) && !/source as Extract<Sequence<T>/.test(relationSequence));
check('analysis closure facts are projected through relation calculus', /relationProject\(input\.dataflow\.state\.closure/.test(astAnalysis) && !/input\.dataflow\.state\.closure\.map/.test(astAnalysis));

let failures = 0;
for (const item of checks) {
  process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
  if (!item.passed) failures += 1;
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
if (failures) process.exitCode = 1;

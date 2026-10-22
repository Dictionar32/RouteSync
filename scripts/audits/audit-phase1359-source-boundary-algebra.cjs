const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const astKinds = ['model', 'resource', 'request', 'route', 'controller', 'response', 'service', 'migration', 'dto', 'middleware', 'provider', 'attribute', 'channel'];
const sourceBoundary = read('packages/core/src/types/upstream/sourceBoundary.ts');
const algebra = read('packages/core/src/types/upstream/sourceBoundaryAlgebra.ts');
const ast = read('packages/core/src/types/upstream/ast.ts');
const checks = [
  ['canonical AST ADT declares all 13 source semantic kinds', astKinds.every((kind) => ast.includes(`'${kind}_ast'`))],
  ['CanonicalSourceNode covers channel AST as well as the previous source variants', /CanonicalSourceNode\s*=/.test(sourceBoundary) && /\|\s*ChannelAst/.test(sourceBoundary)],
  ['SourceBoundaryInput has a matching channel source variant', /kind:\s*'channel_source';\s*readonly node:\s*ChannelAst/.test(sourceBoundary)],
  ['boundary algebra maps every AST discriminant to a matching source variant', astKinds.every((kind) => algebra.includes(`case '${kind}_ast'`) && algebra.includes(`kind: '${kind}_source'`))],
  ['boundary algebra is an exhaustive closed-ADT projection', /const exhaustive:\s*never\s*=\s*node/.test(algebra)],
  ['boundary algebra does not inspect source text or reclassify Laravel semantics', !/readFileSync|\.match\(|\.split\(|httpMethod|semanticClassifier/.test(algebra)],
  ['boundary projection preserves the original node reference', /sourceBoundaryNodeOf\s*=\s*\(input:\s*SourceBoundaryInput\):\s*CanonicalSourceNode\s*=>\s*input\.node/.test(algebra)],
  ['algebra is exported through the upstream public barrel', /sourceBoundaryInputFromCanonicalNode/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['operation identity remains authority/algebra-owned', /OperationIdentityCapabilityRuntimeAlgebraInterface/.test(read('packages/core/src/types/upstream/operationIdentityCapability.ts')) && exists('packages/core/src/types/upstream/operationIdentityCapabilityAlgebra.ts')],
  ['manifest wiring still validates canonical AST before source model construction', /validateCompleteSourceAst/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts')) && /buildCompleteLaravelSourceModel/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['source-boundary projection is not inserted as a redundant pass into canonical manifest wiring', !/sourceBoundaryInputFromCanonicalNode|sourceBoundaryNodeOf/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['DataFlowInterface still separates producer and consumer contracts', /DataFlowProducerInterface/.test(read('packages/core/src/types/dataflow/dataFlowInterface.ts')) && /DataFlowConsumerAlgebraInterface/.test(read('packages/core/src/types/dataflow/dataFlowInterface.ts'))],
  ['IR and structural graph remain separate projection lanes', /SemanticDataflow/.test(read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts')) && /GraphEdgeRelation/.test(read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts'))],
  ['CLI and SDK consume explicit operation identity capability', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(read('packages/cli/src/generators/sdk/apiObjectEmitter.ts')) && /if \(!route\.operationIdentity\)/.test(read('packages/sdk/src/defineApi.ts'))],
  ['build script remains tsdown', read('package.json').match(/"build"\s*:\s*"([^"]+)"/)?.[1] === 'tsdown'],
];
const report = {
  phase: 1359,
  audit: 'source-boundary-algebra',
  purpose: 'Close the canonical AST-to-boundary ADT projection without adding a second semantic classifier; preserve the upstream→wiring→downstream authority boundary.',
  checks: checks.map(([name, ok]) => ({ name, ok })),
  passedChecks: checks.filter(([, ok]) => ok).length,
  totalChecks: checks.length,
  sourceKinds: astKinds.map((kind) => ({ astKind: `${kind}_ast`, boundaryKind: `${kind}_source` })),
  designDecision: 'The algebra maps only existing canonical AST discriminants. It does not infer Laravel semantics, read source text, duplicate source nodes, or replace DataFlowAuthority/GraphEdgeRelation.',
  validationLimits: ['Static contract audit only; not a full TypeScript build or runtime test.', 'TypeScript 7 compatibility is not claimed unless the repository-pinned compiler executes the build.'],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1359-source-boundary-algebra.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const failures = report.checks.filter((check) => !check.ok);
console.log(JSON.stringify({ phase: report.phase, audit: report.audit, passed: failures.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failures.map(({ name }) => name), report: reportPath }, null, 2));
process.exitCode = failures.length ? 1 : 0;

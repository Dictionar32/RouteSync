const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = directory => fs.readdirSync(path.join(root, directory), { recursive: true }).filter(file => typeof file === 'string' && /\.(ts|tsx|cjs|json)$/.test(file));
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const facade = read('packages/core/src/compiler/frontend/php/astClassifierEvidence.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const classifier = read('packages/core/src/compiler/frontend/php/astClassifier.ts');
const relations = read('packages/core/src/compiler/scanner/semantic/semanticEvidenceRelations.ts');
const upstream = walk('packages/core/src/types/upstream').filter(file => /\.ts$/.test(file));
const core = walk('packages/core/src').filter(file => /\.ts$/.test(file));
const downstream = ['packages/react/src', 'packages/sdk/src', 'packages/cli/src', 'examples/ecommerce-shop-source'].flatMap(directory => walk(directory).map(file => path.join(directory, file)));
const packageJson = JSON.parse(read('package.json'));
const operationIdentity = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const ir = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const allCore = core.map(file => read(path.join('packages/core/src', file))).join('\n');
const allDownstream = downstream.map(file => { try { return read(file); } catch { return ''; } }).join('\n');
const checks = {
  upstreamContractDefinesClosedRequestADT: contract.includes('AstClassifierEvidenceInterface<TToken, TValue, TBlock>') && contract.includes('readonly expression:') && contract.includes('readonly block:') && !contract.includes("readonly kind: 'semantic'"),
  upstreamContractDefinesClosedResultADT: contract.includes('AstClassifierEvidenceResult<TValue, TBlock>') && contract.includes("readonly kind: 'expression'") && contract.includes("readonly kind: 'block'") && !contract.includes("readonly kind: 'semantic'"),
  upstreamClassifierPortHasExactlyOneMethod: /interface AstClassifierEvidenceInterface[\s\S]*?readonly expression:[\s\S]*readonly block:/.test(contract) && !/readonly classify:/.test(contract),
  contractHasNoCompilerRuntimeImports: !/from ['"].*(compiler|scanner)\//.test(contract),
  facadeIsNarrowAndDispatchesThroughSinglePort: facade.split('\n').length < 90 && facade.includes('Object.freeze({') && facade.includes('expression: classifyExpression') && facade.includes('block: classifyBlock'),
  facadeHasNoTypeAssertionEscape: !/\bresult\s+as\b/.test(facade),
  runtimeIsNotImportedByOtherCoreConsumers: (allCore.match(/from ['"][^'"]*astClassifierRuntime['"]/g) || []).length === 1,
  astConsumersDoNotImportRuntimeDirectly: !classifier.includes('astClassifierRuntime') && !relations.includes('astClassifierRuntime'),
  astConsumersUseEvidencePort: classifier.includes('semanticEvidenceFold') && relations.includes('classifyAstValue') && relations.includes('classifyAstTokens') && relations.includes('classifyPhpBlock'),
  astAbsentEvidenceDoesNotReclassify: classifier.includes('AST value evidence unexpectedly absent') && classifier.includes('AST token evidence unexpectedly absent') && classifier.includes('PHP block evidence unexpectedly absent') && !/=>\s*astClassifierEvidenceInterface\./.test(classifier),
  operationIdentityContractHasSemanticIdentityCapability: /OperationIdentityCapability/.test(operationIdentity) && /identity|operationId/i.test(operationIdentity),
  semanticDataflowSeparatesInputAndJudgment: /SemanticDataflowInput/.test(dataflow) && /SemanticDataflowJudgment/.test(dataflow),
  upstreamAuthorityOwnsDataflowReasoning: /createSemanticDataflowJudgment|semanticDataflowReasoningAuthority/.test(authority),
  irConsumesClosedDataflowAuthority: /DataFlowAuthorityInterface/.test(ir) && /SemanticDataflowJudgment/.test(ir),
  noDirectRuntimeImplementationImportsInTargetPackages: !/(from ['"][^'"]*astClassifierRuntime['"])/.test(allDownstream),
  packageVersionAndBuildPreserved: packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
  expectedTraceSurfacesPresent: upstream.length > 80 && downstream.length > 20,
};
const result = { phase: 1400, audit: 'ast-adt-single-port-and-semantic-boundary', trace: { upstreamTypeFiles: upstream.length, coreTypeScriptFiles: core.length, downstreamFiles: downstream.length }, checks: Object.entries(checks).map(([name, passed]) => ({ name, passed })), passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length, failures: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name) };
const report = path.join(root, 'scripts/audits/reports/phase1400-ast-adt-single-port-and-semantic-boundary.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.failures.length) process.exitCode = 1;

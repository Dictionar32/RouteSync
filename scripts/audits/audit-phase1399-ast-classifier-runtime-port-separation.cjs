const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const facade = read('packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const classifier = read('packages/core/src/compiler/scanner/lexer/astClassifier.ts');
const relations = read('packages/core/src/compiler/scanner/semantic/semanticEvidenceRelations.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const allCoreSource = fs.readdirSync(path.join(root, 'packages/core/src'), { recursive: true }).filter(file => typeof file === 'string' && file.endsWith('.ts')).map(file => read(path.join('packages/core/src', file))).join('\n');
const packageJson = JSON.parse(read('package.json'));
const checks = {
  upstreamContractDeclaresSingleRequestPort: /interface AstClassifierEvidenceInterface<TToken, TValue, TBlock>/.test(contract) && !/interface AstSyntaxClassifierInterface/.test(contract),
  upstreamContractDeclaresClosedSemanticEvidencePort: contract.includes('interface AstClassifierEvidenceInterface<TToken, TValue, TBlock>') && contract.includes('readonly expression:') && contract.includes('readonly block:') && !contract.includes("readonly kind: 'semantic'"),
  upstreamContractHasNoCompilerRuntimeImports: !/from ['"].*(compiler|scanner)\//.test(contract),
  facadeIsSmallAndDelegatesToRuntime: facade.split('\n').length < 90 && facade.includes("from './astClassifierRuntime'") && facade.includes('AstClassifierEvidenceInterface<TokenDescriptor, PhpAstValue, PhpBlock>'),
  facadeProvidesOnlyContractCapabilities: facade.includes('Object.freeze({') && facade.includes('expression: classifyExpression') && facade.includes('block: classifyBlock') && facade.includes('produceAstSemanticEvidence(input)'),
  parserImplementationIsSeparated: runtime.length > 30000 && runtime.includes('function classifyAstTokens') && !runtime.includes('export const astClassifierEvidenceInterface'),
  classifierConsumesPortInsteadOfRuntimeNamespace: classifier.includes("from '../semantic/semanticEvidenceRelations'") && classifier.includes('semanticEvidenceFold') && !classifier.includes('astClassifierRuntime') && !classifier.includes('astClassifierEvidenceInterface.classify'),
  semanticRelationsConsumePortInsteadOfRuntimeNamespace: relations.includes("from '../lexer/astClassifierEvidence'") && relations.includes('classifyAstValue') && relations.includes('classifyAstTokens') && relations.includes('classifyPhpBlock') && !relations.includes('astClassifierRuntime'),
  upstreamContractIsPubliclyExported: upstreamIndex.includes("export * from './astClassifierEvidenceContract'"),
  runtimeImplementationIsNotImportedByOtherCoreConsumers: (allCoreSource.match(/from ['"][^'"]*astClassifierRuntime['"]/g) || []).length === 1,
  packageVersionAndBuildPreserved: packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
};
const result = { phase: 1399, audit: 'ast-classifier-runtime-port-separation', checks: Object.entries(checks).map(([name, passed]) => ({ name, passed })), passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length, failures: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name) };
const report = path.join(root, 'scripts/audits/reports/phase1399-ast-classifier-runtime-port-separation.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.failures.length) process.exitCode = 1;

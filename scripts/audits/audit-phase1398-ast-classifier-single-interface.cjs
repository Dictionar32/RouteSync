const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contractPath = 'packages/core/src/types/upstream/astClassifierEvidenceContract.ts';
const classifierPath = 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts';
const contract = read(contractPath);
const classifier = read(classifierPath);
const packageJson = JSON.parse(read('package.json'));
const checks = {
  contractIsDedicatedUpstreamType: contract.includes('interface AstClassifierEvidenceInput<TToken>') && contract.includes('interface AstClassifierEvidenceInterface<TToken, TValue, TBlock>') && contract.includes('interface AstSyntaxClassifierInterface<TToken, TValue, TBlock>'),
  contractDoesNotImportCompilerRuntime: !/from ['"].*compiler\//.test(contract) && !/from ['"].*scanner\//.test(contract),
  requestHasOnlyEvidenceBoundary: /readonly node:/.test(contract) && /readonly source:/.test(contract) && /readonly tokens: readonly TToken\[\]/.test(contract) && !/manifest|graph|runtimeContext|compilerProgram|targetProjection/.test(contract),
  evidenceBuilderAcceptsSingleInterfaceInput: /classifyAstSemanticEvidence = \(input: AstClassifierEvidenceInput<TokenDescriptor>\)/.test(classifier),
  oldPositionalTripleSignatureRemoved: !/classifyAstSemanticEvidence = \(node: AstNodeIdentity, source: SourceSpan, tokens:/.test(classifier),
  consumerUsesExplicitInterfaceObject: /classifyAstSemanticEvidence = \(input: AstClassifierEvidenceInput<TokenDescriptor>\)/.test(classifier) && !classifier.includes('astClassifierEvidenceInterface'),
  returnsClosedStageInterface: classifier.includes('scanner_syntax'),
  packageVersionAndBuildPreserved: packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown',
};
const result = { phase: 1398, audit: 'ast-classifier-single-interface-contract', checks: Object.entries(checks).map(([name, passed]) => ({ name, passed })), passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length, failures: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name) };
const report = path.join(root, 'scripts/audits/reports/phase1398-ast-classifier-single-interface.json');
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.failures.length) process.exitCode = 1;

const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const checks = {
  sourceFileIdentityImportedForDiscovery: /\bSourceFile\b/.test(composition) && /discovered:\s*readonly SourceFile\[\]/.test(composition),
  partialSourceIdentityPreserved: /partialSources:\s*Object\.freeze\(\[\.\.\.partialSources\]\)/.test(composition),
  nestedSourceIdentityPreserved: /accumulated\s*=\s*\[\.\.\.nested\.sources\]/.test(composition),
  sourceIdentityNotStringifiedAndRewrapped: !/nested\.sources\.map\(source\s*=>\s*source\.value\.value\)/.test(composition) && !/accumulated\.map\(createSourceFile\)/.test(composition) && !/discovered\.map\(createSourceFile\)/.test(composition),
  existingDiscoveryContractReused: /interface LaravelControllerSourceDiscoveryInterface/.test(upstream) && /type LaravelControllerSourceDiscoveryResult/.test(upstream) && /interface LaravelControllerSourceDiscoveryJudgmentOperations/.test(upstream),
  manifestJudgmentContinuationRetained: /fromManifestBuilderJudgment:\s*judgment\s*=>\s*judgment\.continueWith/.test(composition),
  noExportFunctionInComposition: !/^\s*export\s+function\s+/m.test(composition),
  collectionsRemainsEmpty: fs.existsSync(collectionsPath) && fs.statSync(collectionsPath).size === 0,
};
const report = { phase: 2890, title: 'Discovery Source Identity Preservation', checks, passed: Object.values(checks).filter(Boolean).length, total: Object.keys(checks).length, typecheckBuildTestsE2e: 'not-run' };
const reportPath = path.join(root, 'packages/cli/src/parsers/php/docs/PHASE2890_DISCOVERY_SOURCE_IDENTITY_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;

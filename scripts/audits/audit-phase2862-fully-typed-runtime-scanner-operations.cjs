const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const walk = directory => fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
}) : [];
const relative = file => path.relative(root, file).split(path.sep).join('/');
const files = [...walk(path.join(root, 'packages/core/src/compiler/scanner')), ...walk(path.join(root, 'packages/core/src/types/upstream')), ...walk(path.join(root, 'packages/cli/src'))]
  .filter(file => !/\/__tests?__?\//.test(relative(file)));
const sources = files.map(file => ({ file: relative(file), text: fs.readFileSync(file, 'utf8') }));
const relations = sources.flatMap(({ file, text }) => [...text.matchAll(/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/g)]
  .filter(match => !match[0].includes('deliberately has no semantic/relations dependency'))
  .map(match => ({ file, statement: match[0] })));
const exportedFunctions = sources.flatMap(({ file, text }) => [...text.matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(match => ({ file, name: match[1] })));
const proof = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticStageProof.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts'), 'utf8');
const composition = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const stageAuthority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticStageAuthority.ts'), 'utf8');
const cliRoot = path.join(root, 'packages/cli/src');
const cliFiles = walk(cliRoot).filter(file => !/\/__tests?__?\//.test(relative(file)));
const cliSources = cliFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.existsSync(collectionsPath) ? fs.statSync(collectionsPath).size : null;
const checks = {
  stageProofHasNoRelationImports: !/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/.test(proof),
  proofAuthorityInterfaceFirst: /export const astSemanticStageProofOperations:\s*AstSemanticStageProofOperationsInterface\s*=\s*Object\.freeze\(/.test(proof),
  proofAndTerminalResultsAreActionableAdt: /readonly kind: 'proof'[\s\S]*readonly continueWith/.test(proof) && /readonly kind: 'terminal'[\s\S]*readonly continueWith/.test(proof),
  proofResolutionUsesExplicitStageCases: /switch \(stage\)/.test(proof) && !/relationEqual|relationResolve|relationGate|relationRefine|relationOptionFold/.test(proof),
  pipelineUsesProofOperations: /astSemanticStageProofOperations\.(?:resolve|obligations|continueFrom)/.test(stageAuthority) || /astSemanticStageProofOperations\.(?:resolve|obligations|continueFrom)/.test(proof),
  manifestCompositionAuthorityPresent: /controllerInvocationManifestCompositionAuthority/.test(composition),
  cliHasNoRelationImports: !/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/.test(cliSources),
  noExportFunctionOnProductionRuntimePath: exportedFunctions.length === 0,
  collectionsEmpty: collectionsBytes === 0,
};
const result = {
  phase: 2862,
  title: 'Fully Typed Runtime Scanner Operations — Actionable Stage Proof ADT',
  runtimeFileCount: sources.length,
  relationImportStatementCount: relations.length,
  relationImportFileCount: new Set(relations.map(({ file }) => file)).size,
  scannerUpstreamCliExportFunctionDeclarations: exportedFunctions,
  collectionsBytes,
  checks,
  remainingRelationImportFiles: [...new Set(relations.map(({ file }) => file))].sort(),
};
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2862_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length }, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;

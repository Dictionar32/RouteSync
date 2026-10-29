const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const walk = directory => fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
}) : [];
const relative = file => path.relative(root, file).split(path.sep).join('/');
const files = [...walk(path.join(root, 'packages/core/src/compiler/scanner')), ...walk(path.join(root, 'packages/core/src/types/upstream')), ...walk(path.join(root, 'packages/cli/src'))].filter(file => !/\/__tests?__?\//.test(relative(file)));
const sources = files.map(file => ({ file: relative(file), text: fs.readFileSync(file, 'utf8') }));
const relations = sources.flatMap(({ file, text }) => [...text.matchAll(/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/g)].map(match => ({ file, statement: match[0] })));
const exportedFunctions = sources.flatMap(({ file, text }) => [...text.matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(match => ({ file, name: match[1] })));
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticStageContract.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts'), 'utf8');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.existsSync(collectionsPath) ? fs.statSync(collectionsPath).size : null;
const checks = {
  topologyHasNoRelationImports: !/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/.test(contract),
  topologyAuthorityInterfaceFirst: /export const astSemanticStageTopologyAuthority:\s*AstSemanticStageTopologyAuthorityInterface\s*=\s*Object\.freeze\(/.test(contract),
  topologyMembershipIsClosedActionableAdt: /ast_semantic_stage_declared/.test(contract) && /ast_semantic_stage_undeclared/.test(contract) && /readonly continueWith: <Result>/.test(contract),
  pipelineConsumesTopologyContinuation: /astSemanticStageTopologyAuthority\.classifyMembership\(stage\)\.continueWith\(/.test(pipeline),
  pipelineGetsOrderFromTopologyAuthority: /astSemanticStageTopologyAuthority\.order\(\)/.test(pipeline),
  noExportFunctionOnProductionRuntimePath: exportedFunctions.length === 0,
  cliHasNoRelationImports: relations.every(({ file }) => !file.startsWith('packages/cli/src/')),
  collectionsEmpty: collectionsBytes === 0,
};
const result = { phase: 2861, title: 'Fully Typed Runtime Scanner Operations — Actionable Stage Topology ADT', runtimeFileCount: sources.length, relationImportStatementCount: relations.length, relationImportFileCount: new Set(relations.map(({ file }) => file)).size, scannerUpstreamCliExportFunctionDeclarations: exportedFunctions, collectionsBytes, checks, remainingRelationImportFiles: [...new Set(relations.map(({ file }) => file))].sort() };
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2861_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length }, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;

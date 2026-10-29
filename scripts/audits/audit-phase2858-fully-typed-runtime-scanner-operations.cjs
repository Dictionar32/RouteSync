const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const walk = directory => fs.existsSync(directory)
  ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
    })
  : [];
const relative = file => path.relative(root, file).split(path.sep).join('/');
const productionFiles = [
  ...walk(path.join(root, 'packages/core/src/compiler/scanner')),
  ...walk(path.join(root, 'packages/core/src/types/upstream')),
  ...walk(path.join(root, 'packages/cli/src')),
].filter(file => !/\/__tests?__?\//.test(relative(file)));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const runtimeSource = productionFiles.map(file => ({ file: relative(file), text: fs.readFileSync(file, 'utf8') }));
const relationImports = runtimeSource.flatMap(({ file, text }) =>
  [...text.matchAll(/from\s*['"][^'"]*semantic\/relations[^'"]*['"]/g)].map(match => ({ file, statement: match[0] })));
const exportedFunctions = runtimeSource.flatMap(({ file, text }) =>
  [...text.matchAll(/^\s*export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)].map(match => ({ file, name: match[1] })));
const inventoryInterface = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const inventoryAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const closeInventory = composition.slice(composition.indexOf('const closeInventory ='), composition.indexOf('\n};', composition.indexOf('const closeInventory =')));
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.existsSync(collectionsPath) ? fs.statSync(collectionsPath).size : null;
const checks = {
  inventoryResultIsExplicitTwoArmAdt: /type LaravelControllerInvocationSemanticJudgmentInventoryResult\s*=\s*\|\s*LaravelControllerInvocationSemanticJudgmentInventoryValidated\s*\|\s*LaravelControllerInvocationSemanticJudgmentInventoryRejected/.test(inventoryInterface),
  validatedArmHasDomainContinuation: /interface LaravelControllerInvocationSemanticJudgmentInventoryValidated[\s\S]*?continueWith: <Result>\(handlers: LaravelControllerInvocationSemanticJudgmentInventoryResultHandlers<Result>\) => Result/.test(inventoryInterface),
  rejectedArmHasDomainContinuation: /interface LaravelControllerInvocationSemanticJudgmentInventoryRejected[\s\S]*?continueWith: <Result>\(handlers: LaravelControllerInvocationSemanticJudgmentInventoryResultHandlers<Result>\) => Result/.test(inventoryInterface),
  authorityConstructsValidatedArmWithContinuation: /const validatedInventoryResult[\s\S]*?handlers\.onValidated\(result\)/.test(inventoryAuthority),
  authorityConstructsRejectedArmWithContinuation: /const rejectedInventoryResult[\s\S]*?handlers\.onRejected\(result\)/.test(inventoryAuthority),
  cliConsumesInventoryViaDomainContinuation: /inventoryResult\.continueWith\(\{[\s\S]*onValidated:[\s\S]*onRejected:/.test(closeInventory),
  cliInventoryDispatchHasNoPrimitiveKindBranch: !/\bif\s*\(|\.kind\s*===/.test(closeInventory),
  noExportFunctionOnProductionRuntimePath: exportedFunctions.length === 0,
  cliHasNoRelationImports: relationImports.every(({ file }) => !file.startsWith('packages/cli/src/')),
  collectionsEmpty: collectionsBytes === 0,
};
const result = {
  phase: 2858,
  title: 'Fully Typed Runtime Scanner Operations — Inventory Judgment Continuation',
  runtimeFileCount: runtimeSource.length,
  relationImportStatementCount: relationImports.length,
  relationImportFileCount: new Set(relationImports.map(({ file }) => file)).size,
  scannerUpstreamCliExportFunctionDeclarations: exportedFunctions,
  collectionsBytes,
  checks,
  remainingRelationImportFiles: [...new Set(relationImports.map(({ file }) => file))].sort(),
};
console.log(JSON.stringify(result, null, 2));
if (Object.values(checks).some(passed => !passed)) process.exitCode = 1;

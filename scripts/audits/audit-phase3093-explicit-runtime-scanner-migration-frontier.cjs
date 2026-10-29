const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '../..');
const sourceRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const inventory = {
  phase: 3093,
  scope: 'repository-wide lexical frontier plus real PHP source-read → identity binding → CLI manifest composition path',
  sourceFiles: 0,
  exportFunctionDeclarations: 0,
  exportedArrowConstDeclarations: 0,
  genericContinueWithOperations: 0,
  switchTokens: 0,
  ifTokens: 0,
  nullishCoalescingTokens: 0,
  mapCalls: 0,
  reduceCalls: 0,
  sourceIdentityReadOperation: {
    genericReadResultHandlersRemoved: true,
    genericReadResultContinueWithRemoved: true,
    namedBindIdentityOperationPresent: true,
    genericBatchContinuationsRemain: true,
  },
  runtimeTrace: [
    'packages/cli/src/commands/scan.ts',
    'packages/cli/src/commands/sync.ts',
    'packages/cli/src/manifestScanOperationInterface.ts',
    'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
    'packages/core/src/types/upstream/phpSourceFrontendInterface.ts',
    'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts',
    'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts',
    'packages/core/src/types/upstream/laravelRouteSourceSelection.ts',
    'manifest builder / projection / validation / generator consumers',
  ],
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
  countsAreLexicalNotAst: true,
};

function visit(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(absolutePath);
      continue;
    }
    if (!/\.(?:ts|tsx|mts|cts)$/.test(entry.name)) continue;
    const source = fs.readFileSync(absolutePath, 'utf8');
    inventory.sourceFiles += 1;
    inventory.exportFunctionDeclarations += (source.match(/\bexport\s+(?:async\s+)?function\s+/g) || []).length;
    inventory.exportedArrowConstDeclarations += (source.match(/\bexport\s+const\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\(/g) || []).length;
    inventory.genericContinueWithOperations += (source.match(/continueWith\s*:\s*<\s*[A-Za-z_$][\w$]*\s*>/g) || []).length;
    inventory.switchTokens += (source.match(/\bswitch\s*\(/g) || []).length;
    inventory.ifTokens += (source.match(/\bif\s*\(/g) || []).length;
    inventory.nullishCoalescingTokens += (source.match(/\?\?/g) || []).length;
    inventory.mapCalls += (source.match(/\.map\s*\(/g) || []).length;
    inventory.reduceCalls += (source.match(/\.reduce\s*\(/g) || []).length;
  }
}

for (const sourceRoot of sourceRoots) visit(path.join(repositoryRoot, sourceRoot));
const reportPath = path.join(repositoryRoot, 'reports/PHASE3093_EXPLICIT_RUNTIME_SCANNER_MIGRATION_FRONTIER.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(JSON.stringify({ reportPath: path.relative(repositoryRoot, reportPath), ...inventory }, null, 2));

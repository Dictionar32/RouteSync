const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const roots = [
  'packages/core/src',
  'packages/cli/src',
  'packages/sdk/src',
  'packages/react/src',
];
const ignored = new Set(['node_modules', 'dist', 'build', '__generated__']);
const patterns = {
  exportedFunctionDeclaration: /\bexport\s+(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
  exportedArrowConstant: /\bexport\s+const\s+([A-Za-z_$][\w$]*)\s*(?::[^=;]+)?=\s*(?:async\s*)?(?:\([^;]*?\)|[A-Za-z_$][\w$]*)\s*=>/gs,
};
const counts = Object.fromEntries(Object.keys(patterns).map((key) => [key, { count: 0, files: [] }]));
const runtimeFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
  'packages/core/src/types/upstream/laravelRouteSourceSelection.ts',
  'packages/core/src/types/upstream/phpSourceFrontendInterface.ts',
  'packages/core/src/types/upstream/sourceProjectIdentity.ts',
];
function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignored.has(entry.name)) return [];
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) ? [target] : [];
  });
}
for (const sourceRoot of roots) {
  for (const file of walk(path.join(root, sourceRoot))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const [key, pattern] of Object.entries(patterns)) {
      const matches = [...source.matchAll(pattern)];
      if (!matches.length) continue;
      counts[key].count += matches.length;
      counts[key].files.push({ path: path.relative(root, file), count: matches.length, names: matches.map((match) => match[1]) });
    }
  }
}
const runtime = Object.fromEntries(runtimeFiles.map((relative) => {
  const source = fs.existsSync(path.join(root, relative)) ? fs.readFileSync(path.join(root, relative), 'utf8') : '';
  return [relative, {
    exists: source.length > 0,
    hasInterfaceTypedExport: /export\s+const\s+\w+\s*:\s*\w+Interface\s*=/.test(source),
    exportedFunctions: [...source.matchAll(/^\s*export\s+(?:async\s+)?function\s+([\w$]+)/gm)].map((match) => match[1]),
    genericContinueWith: /continueWith\s*<\s*Result\s*>/.test(source),
  }];
}));
const report = {
  phase: 3089,
  title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations',
  scanKind: 'lexical inventory; not a TypeScript AST transform',
  scanRoots: roots,
  exportedDeclarationInventory: counts,
  runtimeTraceFiles: runtime,
  completion: {
    repositoryWideExportConversion: false,
    fullTypecheckVerified: false,
    fullTestSuiteVerified: false,
    phpToCliManifestGeneratorE2eVerified: false,
  },
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);

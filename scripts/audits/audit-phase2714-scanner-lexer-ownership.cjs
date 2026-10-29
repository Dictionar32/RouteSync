const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src/compiler');
const oldLexer = path.join(core, 'scanner/lexer');
const phpFrontend = path.join(core, 'frontend/php');
const routeParser = path.join(phpFrontend, 'routeAst/routeDeclarationParser.ts');
const cliFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/upstreamCompositionFactory.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
];
const allSourceRoots = [path.join(root, 'packages/cli/src'), path.join(root, 'packages/core/src'), path.join(root, 'packages/sdk/src')];
const files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|js|cjs|mjs)$/.test(entry.name)) files.push(full);
  }
}
allSourceRoots.forEach(walk);
const legacyReferences = files.flatMap((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return /compiler\/scanner\/lexer|scanner\/lexer/.test(text) ? [path.relative(root, file)] : [];
});
const missingCliTraceFiles = cliFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const frontendFileCount = fs.existsSync(phpFrontend)
  ? walkCount(phpFrontend)
  : 0;
function walkCount(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, entry) => {
    const full = path.join(dir, entry.name);
    return sum + (entry.isDirectory() ? walkCount(full) : 1);
  }, 0);
}
const result = {
  phase: 2714,
  audit: 'scanner-lexer-ownership-migration',
  checks: {
    oldScannerLexerDirectoryRemoved: !fs.existsSync(oldLexer),
    phpFrontendOwnerExists: fs.existsSync(phpFrontend),
    noLegacyLexerPathReferencesInRuntimeSource: legacyReferences.length === 0,
    cliManifestTraceFilesPresent: missingCliTraceFiles.length === 0,
    routeParserUsesInterfaceTypedObject: fs.existsSync(routeParser) && /export const routeDeclarationParser:\s*RouteDeclarationParserInterface\s*=\s*Object\.freeze/.test(fs.readFileSync(routeParser, 'utf8')),
    routeParserNoLongerExportsFunction: fs.existsSync(routeParser) && !/export\s+function\s+parseRouteDeclarations/.test(fs.readFileSync(routeParser, 'utf8')),
  },
  metrics: {
    filesMovedToFrontendPhp: frontendFileCount,
    runtimeSourceFilesScanned: files.length,
    legacyLexerPathReferenceFiles: legacyReferences,
    missingCliTraceFiles,
  },
  trace: [
    'CLI scan/sync command',
    'routeSyncCliManifestScanOperationFactory',
    'upstream composition factory',
    'controllerInvocationManifestCompositionAuthority',
    'source discovery/acquisition and canonical source identity',
    'PHP frontend AST/syntax extraction and invocation semantic judgment',
    'inventory receipt closure and validation',
    'manifestBuilderOperationPreparation',
    'manifest judgment/projection (accepted or blocked)',
  ],
  limitations: [
    'This migration removes compiler/scanner/lexer and moves its 210 files into compiler/frontend/php.',
    'Other implementation folders still remain under compiler/scanner; scanner is not yet wiring-only.',
    'Typecheck, unit tests, and CLI end-to-end tests were not run in this dependency-free workspace.',
  ],
};
console.log(JSON.stringify(result, null, 2));
if (Object.values(result.checks).some((value) => value !== true)) process.exitCode = 1;

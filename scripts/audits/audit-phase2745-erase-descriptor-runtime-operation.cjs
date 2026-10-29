const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const scanner = path.join(core, 'compiler/scanner');
const read = (file) => fs.readFileSync(file, 'utf8');
const walk = (dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(file) : [file];
    })
  : [];
const sourceFiles = walk(core).filter((file) => /\.(ts|tsx)$/.test(file));
const operationRoot = path.join(scanner, 'operations/domain-model');
const relationDir = path.join(core, 'semantic/relations');
const foundationDir = path.join(core, 'semantic/foundation');
const patternCompiler = path.join(operationRoot, 'channel/patternCompiler.ts');
const channelFactories = path.join(operationRoot, 'channel/channelFactories.ts');
const cliScan = path.join(root, 'packages/cli/src/commands/scan.ts');
const cliSync = path.join(root, 'packages/cli/src/commands/sync.ts');
const cliComposition = path.join(root, 'packages/cli/src/upstreamCompositionFactory.ts');
const manifestBuilder = path.join(core, 'compiler/scanner/wiring/upstreamManifestBuilder.ts');
const operationText = read(patternCompiler);
const channelText = read(channelFactories);
const sourceText = sourceFiles.map(read).join('\n');
const scannerSourceFiles = walk(scanner).filter((file) => /\.(ts|tsx)$/.test(file));
const scannerSourceText = scannerSourceFiles.map(read).join('\n');
const relationFoundationRefs = (sourceText.match(/relationFoundation/g) || []).length;
const oldDescriptorImports = sourceFiles.filter((file) => /(?:from\s*|import\s*\(|import\s+)["'][^"']*compiler\/scanner\/descriptors(?:\/|["'])/.test(read(file)));
const checks = [
  ['legacy subscanners directory is absent', !fs.existsSync(path.join(scanner, 'subscanners'))],
  ['legacy descriptors directory is absent', !fs.existsSync(path.join(scanner, 'descriptors'))],
  ['domain model files preserved in operations/domain-model', walk(operationRoot).length === 81],
  ['no runtime imports point to the removed descriptors path', oldDescriptorImports.length === 0],
  ['semantic/relations exists and is empty', fs.existsSync(relationDir) && walk(relationDir).length === 0],
  ['semantic/foundation exists and is empty', fs.existsSync(foundationDir) && walk(foundationDir).length === 0],
  ['no relationFoundation references remain in core source', relationFoundationRefs === 0],
  ['runtime pattern compiler is an internal implementation', operationText.includes('function compileBroadcastRuntimePatternImplementation') && !operationText.includes('export function compileBroadcastRuntimePattern(')],
  ['runtime pattern compiler has an explicit interface', operationText.includes('export interface BroadcastRuntimePatternCompilerInterface')],
  ['runtime pattern compiler is an interface-typed frozen object', /export const broadcastRuntimePatternCompiler:\s*BroadcastRuntimePatternCompilerInterface\s*=\s*Object\.freeze/.test(operationText)],
  ['channel factory runtime calls the operation object', channelText.includes('broadcastRuntimePatternCompiler.compile(')],
  ['migrated channel runtime files no longer import semantic relations', !/semantic\/(?:relations|foundation)\//.test(operationText + channelText)],
  ['CLI scan uses shared manifest scan operation', read(cliScan).includes('manifestScanOperation.scan(')],
  ['CLI sync uses shared manifest scan operation', read(cliSync).includes('manifestScanOperation.scan(')],
  ['upstream composition creates shared manifest operation', read(cliComposition).includes('routeSyncCliManifestScanOperationFactory.create(')],
  ['manifest builder preserves complete and blocked ADTs', read(manifestBuilder).includes("kind: 'manifest_builder_complete'") && read(manifestBuilder).includes("kind: 'manifest_builder_blocked'")],
];
const report = {
  phase: 2745,
  title: 'Erase descriptor layer; interface-first runtime compiler operation',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  metrics: {
    domainModelFiles: walk(operationRoot).length,
    sourceFilesScanned: sourceFiles.length,
    oldDescriptorImportFiles: oldDescriptorImports.length,
    relationFoundationReferences: relationFoundationRefs,
    exportedFreeFunctionsStillUnderScanner: (scannerSourceText.match(/^export\s+(?:async\s+)?function\s+/gm) || []).length,
    filesStillReferencingRelationsOrFoundation: sourceFiles.filter((file) => /semantic\/(?:relations|foundation)\//.test(read(file))).length,
  },
  runtimeTrace: [
    'CLI scan / sync',
    'composition.manifestScanOperation.scan(input)',
    'routeSyncCliManifestScanOperationFactory.create(...)',
    'manifest composition and builder preparation',
    'laravelSourceAstPipelineFactory / runtime scanner wiring',
    'typed AST and semantic judgment production',
    'manifest_builder_complete | manifest_builder_blocked',
    'manifest projection',
  ],
};
console.log(JSON.stringify(report, null, 2));
if (report.passed !== report.total) process.exitCode = 1;

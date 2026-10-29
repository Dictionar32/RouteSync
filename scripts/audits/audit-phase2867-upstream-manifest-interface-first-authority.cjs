const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = directory => fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : target.endsWith('.ts') ? [target] : [];
}) : [];
const relative = file => path.relative(root, file).split(path.sep).join('/');
const runtimeFiles = [...walk(path.join(root, 'packages/core/src/compiler/scanner')), ...walk(path.join(root, 'packages/core/src/types/upstream')), ...walk(path.join(root, 'packages/cli/src'))]
  .filter(file => !/\/(?:__tests?|__test__)\//.test(relative(file)) && !/\.test\.ts$/.test(file));
const authorityPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts';
const contractPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts';
const authority = read(authorityPath);
const contract = read(contractPath);
const cliScan = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const collectionsBytes = fs.statSync(collectionsPath).size;
const checks = {
  existingUpstreamAuthorityInterfaceReused: /export const laravelControllerInvocationSemanticJudgmentAuthority:\s*LaravelControllerInvocationSemanticJudgmentAuthorityInterface\s*=\s*new LaravelControllerInvocationSemanticJudgmentAuthority\(/.test(authority) && /interface LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(contract),
  upstreamAuthorityAcceptsClosedInputAndReturnsJudgment: /judge\(input: LaravelControllerInvocationSemanticInput\): LaravelControllerInvocationSemanticJudgmentInterface/.test(contract),
  authorityRoutesAllClosedJudgmentCases: ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => authority.includes(kind)),
  cliManifestFactoryUsesNamedInterface: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliScan),
  cliManifestCompositionRemainsCanonical: /controllerInvocationManifestCompositionAuthority/.test(composition),
  scanAndSyncConsumeManifestOperation: /manifestScanOperation\.scan\(/.test(scan) && /manifestScanOperation\.scan\(/.test(sync),
  scanAndSyncUseManifestDomainContinuation: /continueForDriftAudit\(/.test(scan) && /continueForDriftAudit\(/.test(sync),
  collectionsRemainEmpty: collectionsBytes === 0,
};
const untypedExportedArrow = [];
const directExportedArrow = [];
for (const file of runtimeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/^\s*export\s+const\s+([A-Za-z_$][\w$]*)\b/gm)) {
    const cursor = match.index + match[0].length;
    const equals = source.indexOf('=', cursor);
    const semicolonBeforeEquals = source.indexOf(';', cursor);
    if (equals < 0 || (semicolonBeforeEquals >= 0 && semicolonBeforeEquals < equals)) continue;
    const initializer = source.slice(equals + 1, Math.min(source.length, equals + 500));
    if (!/^\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?=>/.test(initializer)) continue;
    const entry = { file: relative(file), name: match[1] };
    directExportedArrow.push(entry);
    const declarationHead = source.slice(cursor, equals);
    if (!(/\S/.test(declarationHead) && declarationHead.includes(':'))) {
      const lineStart = source.lastIndexOf('\n', match.index) + 1;
      const lineEnd = source.indexOf('\n', match.index);
      untypedExportedArrow.push({ ...entry, declaration: source.slice(lineStart, lineEnd < 0 ? source.length : lineEnd).trim().slice(0, 180) });
    }
  }
}
const previous = JSON.parse(read('packages/core/src/types/upstream/PHASE2866_AUDIT.json'));
const result = {
  phase: 2867,
  title: 'Upstream Manifest Interface-First Authority Contract and Runtime Trace',
  runtimeFileCount: runtimeFiles.length,
  checks,
  directExportedArrowCount: directExportedArrow.length,
  directExportedArrowSample: directExportedArrow.slice(0, 30),
  untypedExportedArrowCount: untypedExportedArrow.length,
  untypedExportedArrowSample: untypedExportedArrow.slice(0, 30),
  priorPhase2866RelationImportStatementCount: previous.relationImportStatementCount,
  priorPhase2866RelationImportFileCount: previous.relationImportFileCount,
  collectionsBytes,
};
fs.writeFileSync(path.join(root, 'packages/core/src/types/upstream/PHASE2867_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, passedChecks: Object.values(checks).filter(Boolean).length, totalChecks: Object.keys(checks).length }, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;

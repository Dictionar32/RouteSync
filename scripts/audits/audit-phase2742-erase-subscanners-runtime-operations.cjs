'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const coreSrc = path.join(root, 'packages/core/src');
const scannerRoot = path.join(coreSrc, 'compiler/scanner');
const operationsRoot = path.join(scannerRoot, 'operations');
const legacyDirectory = path.join(scannerRoot, 'sub' + 'scanners');
const relationDirectory = path.join(coreSrc, 'semantic/relations');
const foundationDirectory = path.join(coreSrc, 'semantic/foundation');

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walkFiles(current));
    else output.push(current);
  }
  return output;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const sourceFiles = [
  ...walkFiles(path.join(root, 'packages')),
  ...walkFiles(path.join(root, 'scripts')),
].filter(file => /\.(?:ts|tsx|js|mjs|cjs|json)$/.test(file));
const operationAllFiles = walkFiles(operationsRoot);
const operationFiles = operationAllFiles.filter(file => file.endsWith('.ts'));
const migratedOperations = [
  ['serviceSourceStatementsOperations', 'packages/core/src/compiler/scanner/operations/serviceSourceStatements.ts'],
  ['resourceDataflowAggregatorOperations', 'packages/core/src/compiler/scanner/operations/controller/resourceDataflowAggregator.ts'],
  ['responseDetectorOperations', 'packages/core/src/compiler/scanner/operations/controller/responseDetector.ts'],
  ['controllerAstCanonicalOperations', 'packages/core/src/compiler/scanner/operations/controller/controllerAstCanonical.ts'],
  ['responseDtoReaderOperations', 'packages/core/src/compiler/scanner/operations/controller/responseDtoReader.ts'],
  ['resourceInvocationDetectorOperations', 'packages/core/src/compiler/scanner/operations/controller/resourceInvocationDetector.ts'],
  ['actionValidationExtractorOperations', 'packages/core/src/compiler/scanner/operations/controller/actionValidationExtractor.ts'],
  ['typeDeriverUtilsOperations', 'packages/core/src/compiler/scanner/operations/typeDeriverUtils.ts'],
  ['serviceAstCanonicalOperations', 'packages/core/src/compiler/scanner/operations/serviceAstCanonical.ts'],
  ['providerAstCanonicalOperations', 'packages/core/src/compiler/scanner/operations/providerAstCanonical.ts'],
  ['InvalidationResolver', 'packages/core/src/compiler/scanner/operations/InvalidationResolver.ts'],
  ['modelColumnOriginOperations', 'packages/core/src/compiler/scanner/operations/model/modelColumnOrigin.ts'],
  ['modelColumnResolutionOperations', 'packages/core/src/compiler/scanner/operations/model/columnInferrer.ts'],
  ['modelColumnFactsCanonicalOperations', 'packages/core/src/compiler/scanner/operations/model/modelColumnFactsCanonical.ts'],
  ['modelParserOperations', 'packages/core/src/compiler/scanner/operations/model/modelParser.ts'],
  ['semanticTypeCanonicalOperations', 'packages/core/src/compiler/scanner/operations/model/semanticTypeCanonical.ts'],
];
const checks = [];
function check(name, passed, detail) { checks.push({ name, passed: Boolean(passed), detail }); }

check('legacy subscanners directory removed', !fs.existsSync(legacyDirectory), path.relative(root, legacyDirectory));
check('scanner operations directory exists', fs.existsSync(operationsRoot), path.relative(root, operationsRoot));
check('all legacy scanner files retained under operations', operationAllFiles.length === 83, `found ${operationAllFiles.length} total files (${operationFiles.length} TypeScript files)`);

const stalePathRefs = sourceFiles.filter(file => {
  if (file.endsWith('laravelSubscannerRetirementInterface.ts')) return false; // Historical type contract records the retired path.
  const text = fs.readFileSync(file, 'utf8');
  return /(?:from\s*['"][^'"]*subscanners\/|import\s*\(['"][^'"]*subscanners\/|compiler\/scanner\/subscanners\/)/.test(text);
});
check('no production/test/script imports use the retired path', stalePathRefs.length === 0, stalePathRefs.map(file => path.relative(root, file)).join(', ') || '0 stale imports');

const operationText = operationFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const freeFunctionExports = operationText.match(/\bexport\s+(?:declare\s+)?(?:async\s+)?function\s+/g) || [];
const exportedCallableConst = operationText.match(/\bexport\s+const\s+[A-Za-z_$][\w$]*(?:\s*:\s*[^=;]+)?\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g) || [];
check('no exported free-function declarations remain in scanner operations', freeFunctionExports.length === 0, `${freeFunctionExports.length} remaining`);
check('no exported const function expressions remain in scanner operations', exportedCallableConst.length === 0, `${exportedCallableConst.length} remaining`);

const operationFailures = [];
for (const [name, relativePath] of migratedOperations) {
  const text = read(relativePath);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expression = new RegExp(`export\\s+const\\s+${escaped}\\s*:\\s*[A-Za-z_$][\\w$]*\\s*=\\s*Object\\.freeze\\s*\\(`);
  if (!expression.test(text)) operationFailures.push(`${relativePath}: ${name}`);
}
check('16 migrated public APIs are interface-typed frozen operation objects', operationFailures.length === 0, operationFailures.join(', ') || '16/16 operation objects verified');

const relationFiles = walkFiles(relationDirectory).length;
const foundationFiles = walkFiles(foundationDirectory).length;
check('semantic/relations remains empty', fs.existsSync(relationDirectory) && relationFiles === 0, `${relationFiles} files`);
check('semantic/foundation remains empty', fs.existsSync(foundationDirectory) && foundationFiles === 0, `${foundationFiles} files`);
const relationFoundationRefs = walkFiles(coreSrc).filter(file => /\.(?:ts|tsx|js|mjs|cjs|json)$/.test(file) && fs.readFileSync(file, 'utf8').includes('relationFoundation'));
check('no relationFoundation reference remains in core source', relationFoundationRefs.length === 0, `${relationFoundationRefs.length} files`);

const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const compositionFactory = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const pipelineDependencies = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
check('CLI scan uses the shared manifest scan operation', /composition\.manifestScanOperation/.test(scanCommand) && /manifestScanOperation\.scan\(/.test(scanCommand), 'scan -> composition.manifestScanOperation.scan');
check('CLI sync uses the shared manifest scan operation', /composition\.manifestScanOperation/.test(syncCommand) && /manifestScanOperation\.scan\(/.test(syncCommand), 'sync -> composition.manifestScanOperation.scan');
check('upstream composition constructs the shared manifest operation', /routeSyncCliManifestScanOperationFactory\.create\(manifestComposition\)/.test(compositionFactory), 'composition factory -> manifest scan operation factory');
check('manifest builder still preserves complete/blocked ADT', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder), 'manifest_builder_complete | manifest_builder_blocked');
check('production pipeline wires interface-first scanner operations', [
  'migrationAstScanningOperation.scan',
  'dtoDeclarationInventoryScanningOperation.scanInventory',
  'serviceAstScanningOperation.scanBundle',
  'middlewareAstScanningOperation.scan',
  'providerAstScanningOperation.scanBundle',
  'laravelResponseScanner',
].every(value => pipelineDependencies.includes(value)), 'migration, DTO, service, middleware, provider, response scanner operation objects');
check('controller execution wiring uses the controller AST operation object', /controllerAstCanonicalOperations\.controllerActionFromMethod/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts')), 'controller operation object is consumed by production wiring');

const report = {
  phase: 2742,
  title: 'Erase subscanners layer; fully typed AST/ADT runtime operations',
  checksPassed: checks.filter(item => item.passed).length,
  checksTotal: checks.length,
  passed: checks.every(item => item.passed),
  scannerOperationFiles: operationFiles.length,
  scannerOperationTotalFiles: operationAllFiles.length,
  migratedOperationObjects: migratedOperations.length,
  oldDirectoryExists: fs.existsSync(legacyDirectory),
  relationFiles,
  foundationFiles,
  relationFoundationReferenceFiles: relationFoundationRefs.length,
  checks,
};
const reportPath = path.join(root, 'reports/PHASE2742_ERASE_SUBSCANNERS_RUNTIME_OPERATIONS_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;

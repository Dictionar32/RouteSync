const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const src = path.join(root, 'packages/core/src');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const mapper = read('packages/core/src/compiler/semantic/resource-production/resourceAstExpressionMapping.ts');
const mapperContract = read('packages/core/src/types/upstream/resourceAstExpressionMappingInterface.ts');
const fieldProducer = read('packages/core/src/compiler/semantic/resource-production/resourceFieldProducer.ts');
const producer = read('packages/core/src/compiler/semantic/resource-production/resourceProducer.ts');
const producerContract = read('packages/core/src/types/upstream/resourceProducerInterface.ts');
const modelSymbol = read('packages/core/src/compiler/semantic/model/originModelSymbol.ts');
const modelIndex = read('packages/core/src/compiler/scanner/symbols/model/index.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');

check('expression mapping operation is an interface-first frozen object', /export const resourceAstExpressionMapping:\s*ResourceAstExpressionMappingOperationInterface<PhpAstValue>\s*=\s*Object\.freeze\(\{\s*map:/.test(mapper), mapper.slice(0, 450));
check('expression mapping interface has a named map operation, not a call signature', /readonly map:\s*\(input: ResourceAstExpressionMappingInput<SyntaxValue>\)/.test(mapperContract) && !/\(input: ResourceAstExpressionMappingInput<SyntaxValue>\): ResourceExpressionModel/.test(mapperContract), 'ResourceAstExpressionMappingOperationInterface.map');
check('field producer is an interface-first frozen object', /export const resourceFieldProducer:\s*ResourceFieldProductionOperationInterface<PhpAstValue, OriginModelSymbol>\s*=\s*Object\.freeze\(\{\s*produce: buildResourceField/.test(fieldProducer), 'resourceFieldProducer.produce');
check('field producer contract is object-shaped', /readonly produce:\s*\(input: ResourceFieldProducerInput<Value, Model>\) => ResourceField/.test(producerContract), 'ResourceFieldProductionOperationInterface.produce');
check('resource producer remains interface-first frozen runtime object', /export const resourceProducer:\s*ResourceProducerContract\s*=\s*Object\.freeze\(\{/.test(producer), 'resourceProducer');
check('moved runtime semantic owners expose no exported free-function declarations', !/export\s+function\s+/.test(mapper + fieldProducer + producer) && !/export const \w+\s*=\s*\([^)]*\)\s*=>/.test(mapper + fieldProducer + producer), 'exported runtime entry points are interface-first objects');
check('resource producer composes the field producer as a typed object', /produceField:\s*resourceFieldProducer/.test(producer) && /resourceProducer\.produceField\.produce\(/.test(producer), 'nested object contract');
check('scanner operations implementation files moved to semantic owner', !exists('packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts') && !exists('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts') && !exists('packages/core/src/compiler/scanner/operations/resourceProducer.ts'), 'three scanner/operations implementation files absent');
check('model symbol and resolved binding types have semantic ownership', exists('packages/core/src/compiler/semantic/model/originModelSymbol.ts') && exists('packages/core/src/compiler/semantic/model/resolvedPropertyBinding.ts') && !exists('packages/core/src/compiler/scanner/symbols/model/originModelSymbol.ts') && !exists('packages/core/src/compiler/scanner/symbols/model/types.ts'), 'semantic/model owns symbol contracts');
check('scanner consumers call the named expression mapping operation', !/mapResourceAstExpression\s*\(/.test(read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts')) && /resourceAstExpressionMapping\.map\(/.test(read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts')), 'resourceBinder');
check('resource binder consumes semantic resource producer', /semantic\/resource-production\/resourceProducer/.test(read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts')), 'resourceBinder import');
check('CLI scan and sync consume the same upstream manifest scan operation', /manifestScanOperation\.scan\(/.test(scan) && /manifestScanOperation\.scan\(/.test(sync), 'scan.ts and sync.ts');
check('CLI retains fail-closed manifest ADT cases', ['controller_invocation_manifest_source_project_identity_blocked','controller_invocation_manifest_source_document_identity_rejected','controller_invocation_manifest_source_documents_blocked','controller_invocation_manifest_source_discovery_blocked','controller_invocation_manifest_inventory_rejected','manifest_builder_blocked'].every((tag) => scan.includes(tag) && sync.includes(tag)), 'both CLI commands retain all six blocked/rejected cases');
check('upstream manifest builder retains complete/blocked judgments', /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder) && /kind:\s*'manifest_builder_complete'/.test(manifestBuilder), 'manifest_builder_complete | manifest_builder_blocked');
const foundationFiles = [
  'packages/core/src/semantic/foundation/relationFoundation.ts',
  'packages/core/src/semantic/kernel/relationFoundation.ts',
  'packages/core/src/semantic/relations/relationFoundation.ts',
];
check('relationFoundation implementation remains absent', foundationFiles.every((file) => !exists(file)), 'no replacement foundation created');

const unresolvedImports = [];
const changedFiles = [
  'packages/core/src/compiler/semantic/model/originModelSymbol.ts',
  'packages/core/src/compiler/semantic/model/resolvedPropertyBinding.ts',
  'packages/core/src/compiler/semantic/resource-production/resourceAstExpressionMapping.ts',
  'packages/core/src/compiler/semantic/resource-production/resourceFieldProducer.ts',
  'packages/core/src/compiler/semantic/resource-production/resourceProducer.ts',
  'packages/core/src/compiler/semantic/resourceFieldSemanticAuthority.ts',
  'packages/core/src/compiler/scanner/symbols/model/index.ts',
  'packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts',
  'packages/core/src/compiler/semantic/resource-model/resourceModelBinding.ts',
  'packages/core/src/compiler/semantic/resource-model/structuralFieldMatcher.ts',
  'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  'packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts',
  'packages/core/src/compiler/scanner/binders/resource/propertyPathResolution.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/propertyAccessBinder.ts',
  'packages/core/src/compiler/scanner/binders/resource/composite/collectionArrayBinders.ts',
  'packages/core/src/compiler/scanner/operations/controller/responseDetector.ts',
];
for (const file of changedFiles) {
  const text = read(file);
  const specs = [...text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)].map((match) => match[1]);
  for (const spec of specs) {
    if (!spec.startsWith('.')) continue;
    const base = path.resolve(path.dirname(path.join(root, file)), spec);
    const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')];
    if (!candidates.some((candidate) => fs.existsSync(candidate))) unresolvedImports.push(`${file}: ${spec}`);
  }
}
check('relative imports resolve in 17 listed implementation/consumer TypeScript files', unresolvedImports.length === 0, unresolvedImports.length ? unresolvedImports.join('; ') : `${changedFiles.length} listed files checked`);

const legacyFoundationImports = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.ts')) {
      const body = fs.readFileSync(full, 'utf8');
      if (/from\s*['"][^'"]*relationFoundation['"]/.test(body)) legacyFoundationImports.push(path.relative(root, full));
    }
  }
}
walk(src);
const passed = checks.filter((item) => item.pass).length;
const result = { phase: 2722, title: 'Typed Resource Runtime Semantic Ownership', passed, total: checks.length, checks, legacyFoundationImportFiles: legacyFoundationImports.length, legacyFoundationImportPaths: legacyFoundationImports, changedFilesChecked: changedFiles.length, unresolvedRelativeImports: unresolvedImports };
const reportDir = path.join(root, 'reports');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, 'PHASE2722_TYPED_RESOURCE_RUNTIME_SEMANTIC_OWNERSHIP_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`RESULT ${passed}/${checks.length}; legacy relationFoundation import files=${legacyFoundationImports.length}`);
if (passed !== checks.length) process.exitCode = 1;

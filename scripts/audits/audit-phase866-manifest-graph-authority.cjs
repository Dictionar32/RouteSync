const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const builder = read('packages/core/src/graph/ServiceGraphBuilder.ts');
const graphIndex = read('packages/core/src/graph/service/index.ts');
const compiler = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const pass = read('packages/cli/src/generators/passes/modelGraphBuilderPass.ts');
const helper = read('packages/cli/src/generators/normalizer/modelGraphBuilder.ts');
const normalizer = read('packages/cli/src/generators/normalizer.ts');
const packageJson = JSON.parse(read('package.json'));

const all = [builder, graphIndex, compiler, pass, helper, normalizer].join('\n');
const checks = {
  sourceModelIsCanonicalGraphInput: /buildFromRouteSyncManifest[\s\S]*compileGraphFromSourceModel/.test(builder),
  legacyManifestGraphMethodRemoved: !/buildFromManifest\s*\(/.test(builder),
  legacyManifestGraphExportRemoved: !/compileGraphFromManifest/.test(graphIndex),
  compilerHasSourceModelOnlyEntryPoint: /export function compileGraphFromSourceModel/.test(compiler) && !/export function compileGraphFromManifest/.test(compiler),
  passDelegatesToCanonicalModelGraphHelper: /buildModelGraph\(manifest, kernel\)/.test(pass),
  passHasNoDuplicateModelConstruction: !/DATABASE_COLUMN_KIND_REGISTRY|as unknown as|fields:\s*Record<string, unknown>/.test(pass),
  helperRemainsSingleModelGraphImplementation: (helper.match(/export function buildModelGraph/g) || []).length === 1,
  normalizerUsesSingleModelGraphPass: (normalizer.match(/new ModelGraphBuilderPass\(kernel\)/g) || []).length === 1,
  noStaleManifestGraphReference: !all.includes('compileGraphFromManifest'),
  packageScriptPresent: packageJson.scripts?.['audit:phase866-manifest-graph-authority'] === 'node scripts/audits/audit-phase866-manifest-graph-authority.cjs',
};
checks.allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify(checks, null, 2));
if (!checks.allChecksPassed) process.exit(1);

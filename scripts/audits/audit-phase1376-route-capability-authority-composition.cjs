const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const routeAuthority = read('packages/core/src/types/upstream/routeCapabilityAuthority.ts');
const semanticAuthority = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const operationAuthority = read('packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts');
const actionVocabulary = read('packages/core/src/types/upstream/routeExecutionVocabulary.ts');
const coreIndex = read('packages/core/src/index.ts');
const boundary = read('packages/core/src/compiler/semantic/route-boundary/capabilityResolution.ts');
const ast = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const manifest = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const ir = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graph = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const cli = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const react = read('packages/react/src/hooks/createHooks.ts');
const laravelRoutes = read('examples/ecommerce-shop-source/routes/api.php');
const frontendPackage = JSON.parse(read('examples/ecommerce-shop-source/frontend/package.json'));
const axiosClient = read('examples/ecommerce-shop-source/frontend/src/lib/core/api-client.ts');
const mapper = read('packages/sdk/src/api-runtime/schemaMapper.ts');
const tanstackHooks = read('examples/ecommerce-shop-source/frontend/src/lib/generic/generic-hooks.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['CRUD route reasoning has a separately executable algebra', /export const routeCapabilityAuthorityAlgebra:\s*RouteCapabilityAuthorityAlgebraInterface/.test(routeAuthority)],
  ['CRUD authority factory accepts the algebra contract through a typed operation object', /export interface RouteCapabilityAuthorityFactoryInterface/.test(routeAuthority) && /readonly create: \(algebra: RouteCapabilityAuthorityAlgebraInterface\) => RouteCapabilityAuthorityInterface/.test(routeAuthority) && /export const routeCapabilityAuthorityFactory:\s*RouteCapabilityAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(routeAuthority)],
  ['CRUD authority delegates every operation without reclassification', /crudRoleFromAction:[\s\S]*?algebra\.crudRoleFromAction\(action\)[\s\S]*?crudRoleFromRoute:[\s\S]*?algebra\.crudRoleFromRoute\(method, path\)[\s\S]*?crudRoleResolution:[\s\S]*?algebra\.crudRoleResolution\(method, path, action, explicit\)[\s\S]*?capabilityEvidence:[\s\S]*?algebra\.capabilityEvidence\(role, explicit, action, method, path\)/.test(routeAuthority)],
  ['Canonical CRUD authority binds the algebra once through the factory object', /routeCapabilityAuthority:\s*RouteCapabilityAuthorityInterface\s*=\s*routeCapabilityAuthorityFactory\.create\(\s*routeCapabilityAuthorityAlgebra/.test(routeAuthority)],
  ['Semantic reasoning has a separately executable algebra', /export const routeCapabilitySemanticAuthorityAlgebra:\s*RouteCapabilitySemanticAuthorityAlgebraInterface/.test(semanticAuthority)],
  ['Semantic authority composition uses a typed factory operation interface', /export interface RouteCapabilitySemanticAuthorityFactoryInterface/.test(semanticAuthority) && /readonly create:[\s\S]*?RouteCapabilitySemanticAuthorityAlgebraInterface/.test(semanticAuthority) && /export const routeCapabilitySemanticAuthorityFactory:\s*RouteCapabilitySemanticAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(semanticAuthority)],
  ['Semantic authority delegates the judgment exactly once', /resolve:[\s\S]*?algebra\.resolve\(input, overrides\)/.test(semanticAuthority)],
  ['Canonical semantic authority binds the reasoning algebra once through the factory object', /routeCapabilitySemanticAuthority:\s*RouteCapabilitySemanticAuthorityInterface\s*=\s*routeCapabilitySemanticAuthorityFactory\.create\(routeCapabilitySemanticAuthorityAlgebra\)/.test(semanticAuthority)],
  ['Semantic reasoning retains canonical RouteActionKind ADT input', /readonly actionKind: RouteActionKind/.test(semanticAuthority) && /ROUTE_ACTION_KIND_REGISTRY\[input\.actionKind\]\.isMutating/.test(semanticAuthority) && !/readonly isMutating: boolean/.test(semanticAuthority)],
  ['Route payload schema shape has one canonical owner', /const hasRules = hasCanonicalRequestFields/.test(semanticAuthority) && /schema\.fields\.length/.test(semanticAuthority)],
  ['Boundary continues to invoke the upstream route semantic authority', /routeCapabilitySemanticAuthority\.resolve/.test(boundary)],
  ['Operation identity exposes a typed runtime operations object over the canonical materializer', /operationIdentityCapabilityContractMaterializer/.test(operationAuthority) && /export const operationIdentityCapabilityAuthorityOperations:\s*OperationIdentityCapabilityAuthorityOperationsInterface\s*=\s*Object\.freeze\(/.test(operationAuthority)],
  ['AST dataflow compatibility exports alias canonical dataflow ADTs', /from '\.\/semanticDataflowInterface'/.test(ast) && /AstDataflowInput/.test(ast) && /AstDataflowJudgment/.test(ast)],
  ['Dataflow adapter preserves the exact upstream judgment without reasoning', /Pure downstream projection/.test(adapter) && /state: judgment/.test(adapter) && /reasoning: judgment\.reasoningContract/.test(adapter)],
  ['Manifest dataflow surface projects existing judgments rather than solving', /dataflowJudgments: manifest\.dataflowJudgments/.test(manifest) && /dataflowQueryPolicyContracts: manifest\.dataflowQueryPolicyContracts/.test(manifest) && !/createSemanticDataflowJudgment/.test(manifest)],
  ['IR and graph retain distinct closed semantic projections', /dataflow\.state\.closure/.test(ir) && /StructuralSemanticRelation/.test(graph) && /createGraphEdgeRelation/.test(graph)],
  ['CLI, SDK, and React remain downstream capability consumers', /operationIdentityReferenceFromCapability/.test(cli) && /missing the upstream operation identity projection/.test(sdk) && /hookKind/.test(react)],
  ['Laravel ecommerce routes remain the source evidence for route capability', /Route::get\('\/produk\/\{id\}'/.test(laravelRoutes) && /Route::post\('\/checkout'/.test(laravelRoutes) && /Route::delete\('\/cart'/.test(laravelRoutes)],
  ['Next.js example keeps the declared Axios/Zod/TanStack Query stack', frontendPackage.dependencies.next === '16.1.6' && Boolean(frontendPackage.dependencies.axios) && Boolean(frontendPackage.dependencies.zod) && Boolean(frontendPackage.dependencies['@tanstack/react-query']) && /axios\.create/.test(axiosClient) && /useQuery|useMutation/.test(tanstackHooks)],
  ['SDK mapper validates with the upstream parser contract', /isSchemaLike/.test(mapper) && /parseWithSchema/.test(mapper) && /upstream parser contract/.test(mapper)],
  ['New factories and canonical algebras are publicly exported', /routeCapabilityAuthorityAlgebra, routeCapabilityAuthorityFactory/.test(coreIndex) && /routeCapabilitySemanticAuthorityAlgebra, routeCapabilitySemanticAuthorityFactory/.test(coreIndex)],
  ['Focused audit registered without changing package/build contract', packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown' && packageJson.scripts['audit:phase1376-route-capability-authority-composition'] === 'node scripts/audits/audit-phase1376-route-capability-authority-composition.cjs'],
  ['Prior semantic ownership and architecture audits remain available', exists('scripts/audit/semantic-ownership-coverage.cjs') && exists('scripts/audit/routesync-architecture.cjs')],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  phase: 1376,
  title: 'Route Capability Authority Composition',
  passed: failures.length === 0,
  checks: checks.length,
  passedChecks: checks.length - failures.length,
  failedChecks: failures,
  decisions: [
    'Keep route/action classification in the canonical CRUD algebra; authority composition only delegates through its interface.',
    'Keep non-CRUD route capability inference in the canonical semantic reasoning algebra; the authority wrapper adds ownership/closure and delegates.',
    'Retain RouteActionKind as the source ADT for mutability and preserve schema, payload, error, and reasoning provenance.',
    'Keep AST, semantic dataflow, structural graph, IR, manifest, CLI, SDK, and React as distinct producer/wiring/consumer boundaries.',
    'Do not claim build/runtime validation from static source-contract checks.'
  ]
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1376-route-capability-authority-composition.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ phase: report.phase, title: report.title, passed: report.passed, checks: report.checks, passedChecks: report.passedChecks, failedChecks: report.failedChecks, report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;

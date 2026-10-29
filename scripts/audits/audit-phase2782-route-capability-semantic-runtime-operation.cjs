'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const authority = read('packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts');
const barrel = read('packages/core/src/index.ts');
const boundary = read('packages/core/src/compiler/semantic/route-boundary/capabilityResolution.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts');
const cli = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const checks = [
  ['collections.ts remains intentionally empty', collections.length === 0],
  ['semantic authority factory has an explicit interface contract', /export interface RouteCapabilitySemanticAuthorityFactoryInterface/.test(authority) && /readonly create:[\s\S]*?RouteCapabilitySemanticAuthorityAlgebraInterface/.test(authority)],
  ['public factory is a frozen typed runtime operation object', /export const routeCapabilitySemanticAuthorityFactory:\s*RouteCapabilitySemanticAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(authority)],
  ['upstream semantic authority module has no exported function declarations', !/^export\s+function\s/m.test(authority)],
  ['legacy factory function is not exposed in the public barrel', !/createRouteCapabilitySemanticAuthority\s*[,}]/.test(barrel)],
  ['factory object and interface are publicly exported', /routeCapabilitySemanticAuthorityFactory/.test(barrel) && /RouteCapabilitySemanticAuthorityFactoryInterface/.test(barrel)],
  ['production authority is created through the typed factory object', /routeCapabilitySemanticAuthority:\s*RouteCapabilitySemanticAuthorityInterface\s*=\s*routeCapabilitySemanticAuthorityFactory\.create\(routeCapabilitySemanticAuthorityAlgebra\)/.test(authority)],
  ['factory delegates to the canonical semantic algebra without reclassification', /algebra\.resolve\(input, overrides\)/.test(authority) && !/createRouteCapabilitySemanticAuthorityImpl[\s\S]*?ROUTE_ACTION_KIND_REGISTRY/.test(authority)],
  ['runtime boundary adapter calls the canonical authority', /routeCapabilitySemanticAuthority\.resolve\(semanticInput, semanticOverrides\)/.test(boundary)],
  ['scanner pipeline retains explicit source AST projection judgment', /LaravelSourceAstProjectionJudgment/.test(scanner)],
  ['manifest builder executes source AST pipeline before manifest construction', /sourceAstPipeline\.execute\(\)/.test(builder)],
  ['manifest lowering remains a distinct operation boundary', /routeSyncManifestLoweringOperations|routeManifestAstProjectionOperations/.test(lowering)],
  ['CLI emitter remains downstream of upstream route semantics', /routeParameterCapabilityOperations|routeResourceFlowOperations/.test(cli)],
  ['domain reasoning contract is retained without introducing a new reasoning primitive', /SemanticReasoningContract<'evidence_resolution'>/.test(authority) && /semanticReasoningContract\('evidence_resolution'\)/.test(authority)],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 2782,
  title: 'Route Capability Semantic Runtime Operation',
  passed: failures.length === 0,
  checks: checks.length,
  passedChecks: checks.length - failures.length,
  failedChecks: failures,
  limits: [
    'Static source-contract audit only; this does not establish a successful TypeScript build or end-to-end runtime test.',
    'SourceScanJudgment remains not fully wired through the scanner-to-manifest path.',
    'collections.ts remains empty by explicit project requirement; dependent collection imports remain a separate root-cause task.',
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase2782-route-capability-semantic-runtime-operation.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${report.passedChecks}/${report.checks} checks passed`);
if (failures.length) console.log(`Failures: ${failures.join('; ')}`);
process.exitCode = failures.length ? 1 : 0;

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/domainIntentCapability.ts');
const barrel = read('packages/core/src/index.ts');
const lowerer = read('packages/cli/src/generators/hooks/hookSourceLowerer.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const checks = [
  ['collections.ts remains empty; no Sequence or generic collection workaround added', collections.length === 0],
  ['domain intent public runtime operations have a named interface contract', /export interface DomainIntentCapabilityRuntimeOperationsInterface\s*\{/.test(upstream)],
  ['public runtime operation is an interface-typed frozen object', /export const domainIntentCapabilityRuntimeOperations:\s*DomainIntentCapabilityRuntimeOperationsInterface\s*=\s*Object\.freeze\(/.test(upstream)],
  ['reference projection is a typed operation property', /readonly referenceFromCapability:\s*\([\s\S]*?\)\s*=>\s*DomainIntentCapabilityReference/.test(upstream) && /referenceFromCapability:\s*domainIntentCapabilityReferenceFromCapabilityImpl/.test(upstream)],
  ['runtime config projection is a typed operation property', /readonly fromRuntimeConfig:\s*\([\s\S]*?\)\s*=>\s*DomainIntentCapabilityContract\s*\|\s*undefined/.test(upstream) && /fromRuntimeConfig:\s*domainIntentCapabilityFromRuntimeConfigImpl/.test(upstream)],
  ['frontend projection is a typed operation property', /readonly fromFrontend:\s*\([\s\S]*?\)\s*=>\s*Readonly<Record<string, DomainIntentCapabilityReference>>/.test(upstream) && /fromFrontend:\s*domainIntentCapabilitiesFromFrontendImpl/.test(upstream)],
  ['target upstream module has no exported function declarations', !/^export\s+(?:async\s+)?function\s/m.test(upstream)],
  ['frontend projection uses the same operation-owned private implementations', /domainIntentCapabilityFromRuntimeConfigImpl\(domainName, intent\)/.test(upstream) && /domainIntentCapabilityReferenceFromCapabilityImpl\(capability\)/.test(upstream)],
  ['closed ADT keeps generic and aggregate-collection variants distinct', /intentKind:\s*'aggregate_collection'[\s\S]*?aggregateCollection:\s*AggregateCollectionIntentCapability/.test(upstream) && /intentKind:\s*'generic'[\s\S]*?aggregateCollection:\s*undefined/.test(upstream)],
  ['incomplete aggregate-collection configuration remains fail-closed', /if \(!createItem \|\| !updateItem \|\| !removeItem \|\| !applyPromo \|\| !removePromo \|\|/.test(upstream) && /if \(!operationsSource \|\| !configSource\) return undefined/.test(upstream)],
  ['core public barrel exports the operation object and interface, not the old function API', /DomainIntentCapabilityRuntimeOperationsInterface/.test(barrel) && /export \{ domainIntentCapabilityRuntimeOperations \}/.test(barrel) && !/export \{[^\n]*domainIntentCapabilitiesFromFrontend/.test(barrel)],
  ['CLI runtime emitter invokes the upstream object operation', /domainIntentCapabilityRuntimeOperations\.fromFrontend\(manifest\.frontend\)/.test(lowerer)],
  ['manifest builder still binds canonical route capability algebra', /resourceGroupCapabilityAuthority satisfies ResourceGroupCapabilityAlgebraInterface/.test(builder) && /resourceGroupCapabilitiesAlgebra\.compose\(completeAst\.ast\.routeFlows\)/.test(builder)],
  ['manifest builder still blocks non-complete AST and source-model judgments', /manifest_builder_source_ast_blocked/.test(builder) && /manifest_builder_source_model_blocked/.test(builder)],
  ['existing semantic reasoning contract is preserved without adding a new primitive', /semanticReasoningContract\('evidence_resolution'\)/.test(upstream) && !/export\s+(?:const|function|class)\s+.*ReasoningPrimitive/.test(upstream)],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 2784,
  title: 'Domain Intent Runtime Operation Object Closure',
  passed: failures.length === 0,
  checks: checks.length,
  passedChecks: checks.length - failures.length,
  failedChecks: failures,
  limits: [
    'Structural source audit only; no full TypeScript build, complete test suite, or CLI end-to-end run is claimed.',
    'The public function exports were replaced with domainIntentCapabilityRuntimeOperations; consumers must use its named properties.',
    'The existing semantic reasoning contract remains required by the current domain capability contract; no new reasoning primitive was introduced.',
    'collections.ts remains intentionally empty and legacy imports elsewhere are not resolved by this phase.',
  ],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase2784-domain-intent-runtime-operation-object.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`\n${report.passedChecks}/${report.checks} checks passed`);
if (failures.length) console.log(`Failures: ${failures.join('; ')}`);
process.exitCode = failures.length ? 1 : 0;

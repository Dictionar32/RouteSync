const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition, detail = '') => checks.push({ name, pass: Boolean(condition), detail });
const intentTypes = read('packages/core/src/types/upstream/domainIntentCapability.ts');
const intentRuntime = read('packages/react/src/hooks/define/intentWrapper.ts');
const defineHooks = read('packages/react/src/hooks/defineHooks.ts');
const ast = read('packages/core/src/types/upstream/ast.ts');
const routeGrouper = read('packages/cli/src/generators/classifier/routeGrouper.ts');
const pkg = JSON.parse(read('package.json'));
check('Domain intent capability is a closed discriminated union', /export type DomainIntentCapabilityReference\s*=/.test(intentTypes) && /intentKind: 'aggregate_collection'/.test(intentTypes) && /intentKind: 'generic'/.test(intentTypes));
check('Upstream materializer rejects incoherent capability payloads', /Incomplete aggregate-collection capability/.test(intentTypes) && /Generic capability contains aggregate-collection payload/.test(intentTypes));
check('React consumes typed generated manifest contract', /runtimeManifest\?: DomainIntentRuntimeManifest/.test(intentRuntime) && /runtimeManifest\?\.domainIntentCapabilities\?\.\[groupName\]/.test(intentRuntime));
check('React no longer performs semantic capability shape classification', !/isDomainIntentCapability/.test(intentRuntime) && !/hasKey\(value, 'intentKind'\)/.test(intentRuntime));
check('React dispatch is only on the closed execution ADT', /capability\.intentKind !== 'aggregate_collection'/.test(intentRuntime) && /const aggregateCollection = capability\.aggregateCollection/.test(intentRuntime));
check('defineHooks requires the generated runtime contract type', /TManifest extends DomainIntentRuntimeManifest/.test(defineHooks));
check('AST eliminator preserves kind correlation without broad Record cast', /<Kind extends AstSemanticSchemaKind, R>/.test(ast) && /visitor\[judgment\.kind\]\(judgment\)/.test(ast) && !/visitor as Readonly<Record<AstSemanticSchemaKind/.test(ast));
check('CLI route projection does not classify CRUD role from method/path', /route\.capability\.crudRole/.test(routeGrouper) && !/match.*HttpMethod|pathname.*crudRole/i.test(routeGrouper));
check('Package build script and version are preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown');
const failed = checks.filter(item => !item.pass);
const report = {
  phase: 1413,
  audit: 'runtime-semantic-ownership',
  status: failed.length ? 'failed' : 'passed_with_residuals',
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  migrated: [
    'React no longer parses unknown runtime manifest payloads to reclassify domain-intent capability; it consumes the generated contract type.',
    'DomainIntentCapabilityReference is a closed discriminated union with upstream coherence checks.',
    'AST eliminator keeps variant-index correlation instead of widening to Record<kind, (AstJudgment) => R>.'
  ],
  residuals: [
    { severity: 'high', owner: 'packages/cli/src/generators/classifier/routeGrouper.ts', detail: 'The CLI projection still invokes routeActionIdentityCapabilityAuthority.resolve. Move resolution to upstream manifest construction and pass the closed identity contract through wiring before claiming runtime-wide migration complete.' },
    { severity: 'medium', owner: 'packages/core/src/compiler/frontend/php/astClassifier.ts', detail: 'Parser/scanner still produces AST classification; continue splitting syntax recognition from semantic judgment production using the AST semantic producer interface.' },
    { severity: 'medium', owner: 'packages/core/src/types/upstream/semanticReasoning.ts', detail: 'A total strategy-to-evidence Record remains upstream. It is not runtime classification, but can be migrated to a relation catalog if Record-free reasoning algebra is a hard requirement.' },
    { severity: 'medium', owner: 'packages/core/src/types/upstream/sourceAstSemanticOriginInterface.ts', detail: 'Origin rule totality currently uses Record in upstream authority; not a downstream/runtime classifier.' },
    { severity: 'medium', owner: 'packages/cli/src/generators/NextActionGenerator.ts', detail: 'Generator emits target control flow based on already-closed execution-signature fields; verify every branch is a projection of an upstream contract, not fresh semantic inference.' }
  ],
  package: { version: pkg.version, build: pkg.scripts.build }
};
fs.mkdirSync(path.join(root, 'scripts/audits/reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'scripts/audits/reports/phase1413-runtime-semantic-ownership.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const result of checks) process.stdout.write(`${result.pass ? 'PASS' : 'FAIL'} ${result.name}${result.detail ? ` — ${result.detail}` : ''}\n`);
process.stdout.write(`RESULT ${report.status} ${report.passed}/${report.total}\n`);
process.stdout.write(`RESIDUALS ${report.residuals.length}\n`);
if (failed.length) process.exitCode = 1;

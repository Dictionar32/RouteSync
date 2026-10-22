const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition, detail) => checks.push({ name, pass: Boolean(condition), detail });
const capability = read('packages/core/src/types/upstream/resourceGroupCapability.ts');
const algebra = read('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts');
const lowerer = read('packages/cli/src/generators/hooks/hookConfigLowerer.ts');
const resolver = read('packages/react/src/hooks/define/groupSlotResolver.ts');
const hookTypes = read('packages/react/src/hooks/define/hookTypes.ts');
const defineHooks = read('packages/react/src/hooks/defineHooks.ts');
const example = read('examples/ecommerce-shop-source/frontend/src/api/hooks.ts');
const hookIndex = read('packages/cli/src/generators/hooks/index.ts');
const hookGenerator = read('packages/cli/src/generators/HookGenerator.ts');
const pkg = JSON.parse(read('package.json'));
check('Upstream route reference carries normalized cache-operation identity', /cacheOperationKey: string/.test(capability) && /cacheOperationKey: relationResolve/.test(algebra));
check('Upstream group contract carries complete route references', /readonly routes: readonly ResourceGroupRouteReference\[\]/.test(capability) && /routes: Object\.freeze\(relationProject\(state\.routes, routeReference\)\)/.test(algebra));
check('CLI projects cache operation key without classifying CRUD role', /reference\.cacheOperationKey/.test(lowerer) && !/matchCrudRole|toNormalizedActionKey/.test(lowerer));
check('React CRUD slots require closed contract', /crudSlots: CrudGroupExecutionContract/.test(hookTypes) && /readonly closed: true/.test(hookTypes));
check('React resolver has no CRUD-role or target-scope scanning fallback', !/firstByRole|crudRole !== 'custom'|targetScope/.test(resolver));
check('React orchestrator passes only the contract to slot resolver', /resolveGroupSlots\(groupConfig\.crudSlots\)/.test(defineHooks) && /resolveGroupExtras\(groupConfig, groupQueryKeys, groupConfig\.crudSlots\)/.test(defineHooks));
const endpointAssignments = (example.match(/^    endpoint: api\.[A-Za-z0-9_]+,$/gm) || []).length;
const slotAssignments = (example.match(/^    crudSlots: noCrudSlots,$/gm) || []).length;
check('All hand-authored ecommerce groups explicitly declare no-slot contract', endpointAssignments > 0 && endpointAssignments === slotAssignments, `${slotAssignments}/${endpointAssignments} endpoint groups declare crudSlots`);
check('Removed generator helper is not re-exported', !/toNormalizedActionKey/.test(hookIndex + hookGenerator));
check('Package version and build command remain unchanged', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown');
const failed = checks.filter(item => !item.pass);
const report = {
  phase: 1406,
  audit: 'runtime-contract-migration',
  status: failed.length === 0 ? 'passed_with_residuals' : 'failed',
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  completedMigrations: [
    'React runtime no longer classifies CRUD slots from endpoint metadata.',
    'HookConfig requires an explicit closed CRUD execution contract.',
    'Upstream resource-group algebra publishes cacheOperationKey for every route reference.',
    'CLI projects action keys from upstream cacheOperationKey and canonical route identity.',
    'Hand-authored ecommerce hook groups declare explicit empty slot contracts rather than depending on runtime inference.'
  ],
  residuals: [
    { id: 'R1', severity: 'medium', owner: 'packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts', detail: 'Source file discovery and reading have moved behind a typed acquisition contract; syntax parsing and semantic judgment production remain coupled.' },
    { id: 'R2', severity: 'closed', owner: 'packages/core/src/types/upstream/routeActionIdentityCapabilityAuthority.ts', detail: 'Closed in Phase 1408: final duplicate action-name resolution is an upstream capability; routeGrouper only projects the result.' },
    { id: 'R3', severity: 'medium', owner: 'packages/core/src/types/domain/resourceGroupDescriptors.ts', detail: 'Legacy role-based descriptor helpers still need call-site trace and retirement.' },
    { id: 'R4', severity: 'medium', owner: 'packages/core/src/types/upstream/semanticDataflowManifestSurface.ts', detail: 'Audit every dataflow consumer to ensure judgments are consumed without independently rebuilding semantic relations.' },
    { id: 'R5', severity: 'high', owner: 'scripts/audits/audit-phase729-semantic-relation-calculus-frontier.cjs', detail: 'Relational calculus stratum closure audit remains failing.' },
    { id: 'R6', severity: 'high', owner: 'scripts/audit-relational-authority-strict.cjs', detail: 'Strict relational authority audit still reports legacy violations.' }
  ],
  package: { version: pkg.version, build: pkg.scripts.build }
};
fs.mkdirSync(path.join(root, 'scripts/audits/reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'scripts/audits/reports/phase1406-runtime-contract-migration.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;

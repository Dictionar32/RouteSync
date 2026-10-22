const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition, detail) => checks.push({ name, pass: Boolean(condition), detail });
const contract = read('packages/core/src/types/upstream/resourceGroupCapability.ts');
const algebra = read('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts');
const lowerer = read('packages/cli/src/generators/hooks/hookConfigLowerer.ts');
const sourceLowerer = read('packages/cli/src/generators/hooks/hookSourceLowerer.ts');
const reactResolver = read('packages/react/src/hooks/define/groupSlotResolver.ts');
const reactTypes = read('packages/react/src/hooks/define/hookTypes.ts');
const exampleHooks = read('examples/ecommerce-shop-source/frontend/src/api/hooks.ts');
const pkg = JSON.parse(read('package.json'));
assert('resource-group contract carries closed slot ADT', /type ResourceGroupSlotDecision\s*=/.test(contract) && /kind: 'absent'/.test(contract) && /kind: 'ambiguous'/.test(contract) && /executionSlots: ResourceGroupExecutionSlots/.test(contract));
assert('slot references carry canonical route and parameter identity', /routeName: string/.test(contract) && /actionName: string/.test(contract) && /parameterKey\?: string/.test(contract));
assert('upstream algebra resolves CRUD slots and custom route references', /slotsFromRoutes/.test(algebra) && /executionSlots: slotsFromRoutes\(state\.routes\)/.test(algebra) && /kind: 'ambiguous'/.test(algebra));
assert('hook generator consumes upstream slot contract', /capability\.executionSlots\.index/.test(lowerer) && /capability\.executionSlots\.updateMember/.test(lowerer));
assert('hook generator resolves projection only by canonical route identity', /candidate\.raw\.identity\.coordinates\.name\.value\.value === reference\.routeName/.test(lowerer) && !/group\.all\.find\(route => route\.raw\.capability\.crudRole/.test(lowerer));
assert('hook source passes manifest contract to lowering', /capabilityByName/.test(sourceLowerer) && /lowerGroupHookConfig\(group, addRouteInvalidations, capability\)/.test(sourceLowerer));
assert('React runtime fallback is removed and HookConfig requires a closed contract', !/firstByRole/.test(reactResolver) && /crudSlots: CrudGroupExecutionContract/.test(reactTypes));
assert('hand-authored ecommerce hook groups explicitly declare slots', (exampleHooks.match(/crudSlots:/g) || []).length >= 18);
assert('package version and build command preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown');
const failed = checks.filter(check => !check.pass);
const report = {
  phase: 1404,
  audit: 'upstream-execution-slot-contract',
  status: failed.length === 0 ? 'passed_with_residuals' : 'failed',
  passed: checks.length - failed.length,
  total: checks.length,
  residuals: [
    { id: 'R1', severity: 'medium', owner: 'packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts', detail: 'Producer boundary exists, but source file discovery and syntax parsing remain combined with semantic product production.' },
    { id: 'R2', severity: 'closed', owner: 'packages/react/src/hooks/define/groupSlotResolver.ts', detail: 'Closed: React requires crudSlots and the checked-in ecommerce example declares explicit contracts.' },
    { id: 'R3', severity: 'medium', owner: 'packages/cli/src/generators/classifier/routeGrouper.ts', detail: 'Duplicate generated action names are still suffixed downstream instead of carrying a final symbol in the upstream route contract.' },
    { id: 'R4', severity: 'medium', owner: 'packages/core/src/types/domain/resourceGroupDescriptors.ts', detail: 'Legacy descriptor helpers still expose role-based route selection; trace callers before retirement.' }
  ],
  checks,
  package: { version: pkg.version, build: pkg.scripts.build }
};
fs.mkdirSync(path.join(root, 'scripts/audits/reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'scripts/audits/reports/phase1404-upstream-execution-slot-contract.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;

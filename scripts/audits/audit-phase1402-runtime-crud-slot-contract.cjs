const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const lowerer = read('packages/cli/src/generators/hooks/hookConfigLowerer.ts');
const hookTypes = read('packages/react/src/hooks/define/hookTypes.ts');
const resolver = read('packages/react/src/hooks/define/groupSlotResolver.ts');
const defineHooks = read('packages/react/src/hooks/defineHooks.ts');
const pkg = JSON.parse(read('package.json'));

check('CLI emits a closed CRUD slot contract', lowerer.includes("kind: 'crud_group_execution_contract'") && lowerer.includes('crudSlots: {'), 'hook config lowering emits explicit slot contract');
check('CLI projects CRUD slots from closed upstream execution-slot ADT', lowerer.includes('capability.executionSlots.index') && lowerer.includes('capability.executionSlots.updateMember') && !lowerer.includes('route.raw.capability.crudRole'), 'generator projects slot decisions without reclassifying routes');
check('CLI carries upstream parameter keys into wiring', lowerer.includes('slot.route.parameterKey') && lowerer.includes('paramRef(capability.executionSlots.show)'), 'parameter names are projected from closed slot decisions before React runtime');
check('Contract contains direct endpoint slots', ['indexService', 'showService', 'createService', 'updateService', 'updateSelfService', 'deleteService', 'deleteSelfService', 'customEndpoints'].every((name) => hookTypes.includes(name)), 'slot contract declares CRUD and custom endpoint references');
check('React resolver accepts the closed contract', resolver.includes('contract: CrudGroupExecutionContract') && resolver.includes("contract.kind !== 'crud_group_execution_contract'") && hookTypes.includes('readonly closed: true'), 'resolver has explicit contract execution branch');
check('React orchestrator passes the contract', defineHooks.includes('resolveGroupSlots(groupConfig.crudSlots)') && defineHooks.includes('resolveGroupExtras(groupConfig, groupQueryKeys, groupConfig.crudSlots)'), 'consumer wiring forwards the emitted contract');
check('Create slot is no longer hardcoded to action name', defineHooks.includes('create:     slots.createService') && !defineHooks.includes('create:     group.create'), 'CRUD create endpoint comes from contract');
check('Synthetic query key guesses removed', !resolver.includes("return [groupName, 'list']") && !resolver.includes("return [groupName, 'detail', id]"), 'no group-name query key fabrication');
check('Route cache and retry are no longer untyped unknowns', !/cache:\s*unknown|retry:\s*unknown|cache\?:\s*unknown|retry\?:\s*unknown/.test(read('packages/core/src/types/request.ts')), 'RouteDefinition cache/retry use boolean and boolean | RetryConfig');
check('SDK endpoint and resource policies are typed', !/cache\?:\s*unknown|retry\?:\s*unknown/.test(read('packages/sdk/src/endpoint.ts') + read('packages/sdk/src/resource.ts')), 'SDK endpoint/resource preserve policy types');
check('Build command and package version preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown', `version=${pkg.version}; build=${pkg.scripts.build}`);
check('Runtime role-scanning fallback is removed', !resolver.includes('firstByRole') && !resolver.includes("crudRole !== 'custom'"), 'React consumes only the closed slot contract');

const failed = checks.filter((item) => !item.pass);
const report = {
  phase: 1402,
  audit: 'runtime-crud-slot-contract',
  status: failed.length === 0 ? 'passed' : 'failed',
  passed: checks.length - failed.length,
  total: checks.length,
  knownMigrationFrontier: 'Runtime role scanning is removed; hand-authored configurations must declare a closed CRUD slot contract.',
  checks,
};
const output = path.join(root, 'scripts/audits/reports/phase1402-runtime-crud-slot-contract.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const routeDataFlow = read('packages/core/src/compiler/frontend/php/routeAst/routeDataFlow.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const cliBoundary = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const checks = [
  ['canonical StringValue factory interface is exported from names', /export const stringValue:\s*StringValueFactoryInterface\s*=\s*createStringValue/.test(names)],
  ['duplicate local stringValue function is absent', !/export const stringValue\s*=\s*\(value:\s*string\)/.test(names)],
  ['route prefix projection uses explicit factory operation', /projectRelation\(route\.prefix, value => stringValue\.create\(value\)\)/.test(routeDataFlow)],
  ['route group-name projection uses explicit factory operation', /projectRelation\(route\.groupNamePrefix, value => stringValue\.create\(value\)\)/.test(routeDataFlow)],
  ['CLI manifest scan boundary remains interface-first', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface/.test(cliBoundary)],
  ['manifest composition input retains domain continuation', /continueToCanonicalization/.test(composition)],
  ['manifest terminal ADT retains domain continuation', /continueForDriftAudit/.test(composition)],
  ['collections invariant remains one newline byte', collections.length === 1 && collections[0] === 10],
  ['deleted relation foundation modules remain absent', !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some((file) => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', file)))],
];
const report = { phase: 3022, checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed' : 'failed', fullTypecheck: 'not_run_environment_missing_dependencies_and_repository_tsconfig_targets_unsupported_by_global_typescript_5.8.3', tests: 'not_run', primitiveElimination: 'incomplete' };
console.log(JSON.stringify(report, null, 2));
if (!report.checks.every((check) => check.passed)) process.exitCode = 1;

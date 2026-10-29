const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['route semantic flow already exposes the existing effective policy ADT', () => read('packages/core/src/types/domain/routes.ts').includes('readonly controllerActionPolicy: Presence<EffectiveControllerActionPolicy>')],
  ['route flow builder requires and preserves the effective policy ADT', () => {
    const source = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
    return source.includes('controllerActionPolicy: import(\'../../../types/upstream/presence\').Presence<') && source.includes('    controllerActionPolicy,');
  }],
  ['canonical scanner resolves binding before effective policy', () => {
    const source = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
    return source.indexOf("const binding = bindingAuthority.judge(") < source.indexOf('const controllerActionPolicy = effectiveControllerActionPolicyForBinding(route, declaration, binding)')
      && source.indexOf('const controllerActionPolicy = effectiveControllerActionPolicyForBinding(route, declaration, binding)') < source.indexOf('routeSemanticFlowFromRouteBoundary(boundary, controllerActionPolicy)');
  }],
  ['policy is derived from the resolved binding candidate rather than re-matching controller/action names', () => {
    const source = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
    return source.includes('binding.outcome.candidate.action') && !source.includes('actions.find(');
  }],
  ['effective policy includes the already-resolved route/group middleware', () => read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes('route: middlewareNames(route.middleware.map(value => value.value.value))')],
  ['effective policy includes resource action middleware and exclusions', () => read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes('resource: projectRouteResourceMiddleware(declaration)')],
  ['existing effective controller/action policy resolver is reused', () => read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes('resolveEffectiveControllerActionPolicy({')],
  ['existing policy catalog can supply the current controller policy when no direct slice is provided', () => read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts').includes('input.policy ?? policyForController(input.controller, policyCatalog)')],
  ['no non-null assertion remains on policy catalog', () => !read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts').includes('policyCatalog!')],
  ['policy-catalog fallback has a regression test', () => read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts').includes('Phase 2335 current controller policy catalog fallback')],
  ['policy algebra/resolver/middleware/resource projection no longer import semantic relations or foundation', () => {
    const files = [
      'packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts',
      'packages/core/src/types/upstream/effectiveControllerActionPolicyAlgebra.ts',
      'packages/core/src/compiler/scanner/upstream/route/routeMiddlewareFlowResolver.ts',
      'packages/core/src/compiler/scanner/upstream/route/resourceMiddlewareProjection.ts',
    ];
    return files.every(file => !/semantic\/(relations|foundation)/.test(read(file)));
  }],
  ['route scanner interface and runtime use contract version 11', () => read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').includes('readonly contractVersion: 11;') && read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes("kind: 'laravel_route_scan_judgment', contractVersion: 11")],
  ['legacy route scanner explicitly represents policy absence instead of fabricating a result', () => read('packages/core/src/compiler/scanner/operations/RouteScanner.ts').includes("routeSemanticFlowFromRouteBoundary(boundary, { kind: 'absent' })")],
  ['no duplicate V2 policy interface was introduced', () => !/EffectiveControllerActionPolicyV2|RouteSemanticFlowV2|LaravelRouteScannerInterfaceV2/.test([
    read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts'),
    read('packages/core/src/types/domain/routes.ts'),
    read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts'),
  ].join('\n'))],
];

const results = checks.map(([name, run]) => ({ name, passed: run() }));
for (const result of results) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const failed = results.filter(result => !result.passed);
process.stdout.write(`${results.length - failed.length}/${results.length} checks passed\n`);
if (failed.length > 0) process.exitCode = 1;

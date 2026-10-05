const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const rel = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(rel) : [rel];
});
const upstream = walk('packages/core/src/types/upstream').filter(file => file.endsWith('.ts') && !file.includes('/__tests__/'));
const effective = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const controller = read('packages/core/src/types/upstream/controller.ts');
const evidence = read('packages/core/src/types/upstream/controllerEvidence.ts');
const resolver = read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const allSource = walk('packages/core/src').filter(file => file.endsWith('.ts')).map(read).join('\n');
const result = {
  effectivePolicyContractPresent: effective.includes("kind: 'effective_controller_action_policy'"),
  authorizationCarriesActionScope: controller.includes('readonly actions: ControllerPolicyActionScope'),
  declarationCarriesInheritanceRelation: evidence.includes('readonly inheritance: import(\'./controller\').ControllerInheritanceRelation | null'),
  resolverComputesInheritance: resolver.includes('inheritedControllers(') && resolver.includes('policyCatalog'),
  resolverFiltersAuthorization: resolver.includes('authorizationApplies('),
  dataflowMiddlewareVariants: [...allSource.matchAll(/kind:\s*['\"]dataflow_(?:middleware|authorization|policy)[^'\"]*['\"]/g)].map(m => m[0]),
  upstreamCompilerImports: upstream.flatMap(file => { const text = read(file); return /from ['\"](?:\.\.\/)*compiler\//.test(text) ? [file] : []; }),
  upstreamScannerImports: upstream.flatMap(file => { const text = read(file); return /from ['\"](?:\.\.\/)*compiler\/scanner\//.test(text) ? [file] : []; }),
  ecomerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
result.clean = result.effectivePolicyContractPresent && result.authorizationCarriesActionScope && result.declarationCarriesInheritanceRelation && result.resolverComputesInheritance && result.resolverFiltersAuthorization && result.dataflowMiddlewareVariants.length === 0 && result.upstreamCompilerImports.length === 0 && result.upstreamScannerImports.length === 0 && !result.ecomerceFixturePresent && !result.ecommerceFixturePresent;
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exitCode = 1;

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const count = (text, pattern) => (text.match(pattern) || []).length;

const cache = read('packages/core/src/types/domain/cacheInvalidation.ts');
const methodSurface = read('packages/core/src/types/domain/resourceModelMethodSurface.ts');
const crud = read('packages/core/src/types/domain/crudRoles.ts');
const semanticValues = read('packages/core/src/types/domain/semanticValues.ts');
const resource = read('packages/core/src/types/upstream/resource.ts');
const orderResource = read('examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php');
const paymentResource = read('examples/ecommerce-shop-source/app/Http/Resources/PaymentResource.php');
const productResource = read('examples/ecommerce-shop-source/app/Http/Resources/ProdukItemResource.php');

const checks = {
  cacheRegistryHasSemanticFactory: cache.includes('SemanticValueFactory.stringValue'),
  cacheRegistryIsExhaustivelySatisfied: cache.includes('} satisfies InvalidationTargetRegistry);'),
  cacheRegistryNoFreeStringValueObject: !cache.includes("kind: 'string_value', value:"),
  methodSurfaceSingleSemanticTypeImport: count(methodSurface, /SemanticType/g) >= 1 && count(methodSurface, /import type \{ SemanticType \}/g) === 1,
  methodSurfaceSingleTraversalCardinalityImport: count(methodSurface, /import type .*ResourceTraversalCardinality/g) === 1,
  crudNoDuplicateCrudRoleExport: count(crud, /export type \{ CrudRole, RouteHookKind \}/g) === 0,
  semanticStringValueFactoryExported: semanticValues.includes('export const SemanticValueFactory') && semanticValues.includes('  stringValue,'),
  upstreamResourceFieldAstModel: resource.includes('export type ResourceFieldOutput') && resource.includes('export type ResourceFieldPresence'),
  ecommerceOrderResourceEvidence: orderResource.includes("'items' => OrderDetailResource::collection($this->details)") && orderResource.includes('$promotion?->discount_minor'),
  ecommercePaymentResourceEvidence: paymentResource.includes('$this->order?->promotion') && paymentResource.includes('OrderDetailResource::collection($this->order?->details)'),
  ecommerceProductResourceEvidence: productResource.includes('$this->frontend?->gambar') && productResource.includes('$this->category?->nama'),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 723, checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;

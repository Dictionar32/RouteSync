const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));
const sourceFiles = [];
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts')) sourceFiles.push(full);
  }
};
walk(path.join(root, 'packages', 'core', 'src'));

const source = sourceFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const upstream = sourceFiles.filter(file => file.includes(`${path.sep}types${path.sep}upstream${path.sep}`) && !file.includes(`${path.sep}__tests__${path.sep}`));
const upstreamText = upstream.map(file => fs.readFileSync(file, 'utf8')).join('\n');

const result = {
  effectivePolicyContractPresent: exists('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts'),
  effectivePolicyResolverPresent: exists('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts'),
  effectivePolicyExported: read('packages/core/src/types/upstream/index.ts').includes("./effectiveControllerActionPolicy"),
  dataflowMiddlewareVariants: [...source.matchAll(/kind:\s*'dataflow_(?:middleware|authorization|controller_policy|route_policy)'/g)].map(m => m[0]),
  upstreamCompilerImports: [...upstreamText.matchAll(/from\s+['\"](?:\.\.\/)*compiler\//g)].map(m => m[0]),
  upstreamScannerImports: [...upstreamText.matchAll(/from\s+['\"](?:\.\.\/)*scanner\//g)].map(m => m[0]),
  ecomerceFixturePresent: exists('examples/ecomerce-shop-source'),
  ecommerceFixturePresent: exists('examples/ecommerce-shop-source'),
};
result.clean = result.effectivePolicyContractPresent &&
  result.effectivePolicyResolverPresent &&
  result.effectivePolicyExported &&
  result.dataflowMiddlewareVariants.length === 0 &&
  result.upstreamCompilerImports.length === 0 &&
  result.upstreamScannerImports.length === 0;
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);

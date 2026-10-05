const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const upstream = path.join(root, 'packages/core/src/types/upstream/semanticDataflowInterface.ts');
const adapter = path.join(root, 'packages/core/src/compiler/scanner/upstream/semanticDataflowInputAdapter.ts');
const authority = path.join(root, 'packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const routeMiddleware = path.join(root, 'packages/core/src/types/upstream/routeMiddleware.ts');
const productionRoot = path.join(root, 'packages');

const read = file => fs.readFileSync(file, 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(target);
  return [target];
});
const productionFiles = walk(productionRoot).filter(file =>
  /\.(ts|tsx|js|cjs|mjs)$/.test(file) &&
  !/(^|[\\/])__tests__([\\/]|$)/.test(file) &&
  !/\.phase\d+\.(ts|tsx|js|cjs|mjs)$/.test(file) &&
  !/PHASE\d+/.test(path.basename(file))
);

const upstreamText = read(upstream);
const adapterText = read(adapter);
const authorityText = read(authority);
const middlewareText = read(routeMiddleware);
const oldExampleRefs = productionFiles.flatMap(file => {
  const text = read(file);
  return /examples\/(?:ecomerce-shop-source|ecommerce-shop-source)/.test(text) ? [path.relative(root, file)] : [];
});

const checks = {
  inputContractExists: fs.existsSync(upstream),
  inputFactTypeExcludesReach: /SemanticDataflowInputFact\s*=\s*Exclude<SemanticDataflowFact,\s*\{\s*readonly kind: 'reaches'/.test(upstreamText),
  inputUsesSeedFacts: /readonly facts: readonly SemanticDataflowInputFact\[\];/.test(upstreamText),
  adapterProducesOnlyCanonicalSeedFacts: /canonicalFact\s*=/.test(adapterText) && !/kind:\s*'reaches'/.test(adapterText),
  authorityOwnsReachClosure: /reachesFrom\(/.test(authorityText) && /transitiveReaches\(/.test(authorityText),
  laravelMiddlewareContractExists: fs.existsSync(routeMiddleware) && /RouteMiddlewareSemanticInput/.test(middlewareText),
  oldExampleRefsAbsentFromProduction: oldExampleRefs.length === 0,
};

for (const [name, value] of Object.entries(checks)) console.log(`${name}: ${value}`);
console.log(`oldExampleRefs: ${JSON.stringify(oldExampleRefs)}`);
console.log(`clean: ${Object.values(checks).every(Boolean)}`);
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);

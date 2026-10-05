const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const typesUpstream = path.join(core, 'types/upstream');
const scanner = path.join(core, 'compiler/scanner');
const scannerUpstream = path.join(scanner, 'upstream');
const fixture = path.join(root, 'packages/sdk/tests/fixtures/ecommerce-shop-source');

const read = file => fs.readFileSync(file, 'utf8');
const walk = dir => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(file));
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) out.push(file);
  }
  return out;
};
const rel = file => path.relative(root, file).replaceAll(path.sep, '/');
const typeFiles = walk(typesUpstream);
const typeProduction = typeFiles.filter(file => !file.includes(`${path.sep}__tests__${path.sep}`));
const scannerFiles = walk(scanner);
const scannerProduction = scannerFiles.filter(file => !file.includes(`${path.sep}__tests__${path.sep}`));
const sourceFiles = walk(core).filter(file => !file.includes(`${path.sep}__tests__${path.sep}`));

const reverseImports = typeFiles.filter(file => /compiler\/scanner(?:\/|['"])/.test(read(file)));
const reverseProduction = typeProduction.filter(file => /compiler\/scanner(?:\/|['"])/.test(read(file)));
const policyLaneFiles = [
  path.join(scanner, 'subscanners/controller/controllerAstCanonical.ts'),
  path.join(scannerUpstream, 'route/effectiveControllerActionPolicyResolver.ts'),
  path.join(typesUpstream, 'effectiveControllerActionPolicyResolver.ts'),
  path.join(typesUpstream, 'controllerActionPolicyRelations.ts'),
  path.join(typesUpstream, 'routeActionPolicyRelations.ts'),
  path.join(typesUpstream, 'highLevelSourceModel.ts'),
];
const dataflowLaneFiles = [
  path.join(scannerUpstream, 'semanticDataflowInputAdapter.ts'),
  path.join(core, 'compiler/analysis/astDataflowAuthority.ts'),
  path.join(core, 'compiler/analysis/astAnalysisInterface.ts'),
  path.join(typesUpstream, 'semanticDataflowInterface.ts'),
];
const policyText = policyLaneFiles.map(read).join('\n');
const dataflowText = dataflowLaneFiles.map(read).join('\n');

const oldExamplePaths = [
  path.join(root, 'examples/ecomerce-shop-source'),
  path.join(root, 'examples/ecommerce-shop-source'),
];
const staleProductionExampleRefs = sourceFiles.filter(file => /examples\/(?:ecomerce-shop-source|ecommerce-shop-source)/.test(read(file)));

const checks = {
  canonicalUpstreamExists: fs.existsSync(typesUpstream),
  literalCoreSrcUpstreamAbsent: !fs.existsSync(path.join(core, 'upstream')),
  noReverseImportsFromUpstream: reverseImports.length === 0,
  noReverseProductionImportsFromUpstream: reverseProduction.length === 0,
  scannerUpstreamImportsCanonicalTypes: scannerProduction.filter(file => file.startsWith(scannerUpstream) && /types\/upstream/.test(read(file))).length > 0,
  oldExampleTreesAbsent: oldExamplePaths.every(file => !fs.existsSync(file)),
  canonicalEcommerceFixtureExists: fs.existsSync(fixture),
  noProductionOldExampleReferences: staleProductionExampleRefs.length === 0,

  laravelAttributesEnterPolicyLane: /ControllerPolicyRelation/.test(read(policyLaneFiles[0])),
  scannerPolicyResolverUsesCanonicalPolicyTypes: /types\/upstream\/controller/.test(read(policyLaneFiles[1])) && /types\/upstream\/effectiveControllerActionPolicy/.test(read(policyLaneFiles[1])),
  upstreamPolicyResolverIsScannerIndependent: !/compiler\/scanner/.test(read(policyLaneFiles[2])),
  routePolicyProjectionIsCanonical: /routeActionPolicyRelationsFromEffectivePolicy/.test(read(policyLaneFiles[4])),
  highLevelModelConsumesPolicyRelations: /routeActionPolicyRelations|controllerActionPolicyRelations/.test(read(policyLaneFiles[5])),

  dataflowInputIsCanonical: /SemanticDataflowInput/.test(read(dataflowLaneFiles[0])),
  dataflowInputExcludesReaches: /SemanticDataflowInputFact = Exclude<SemanticDataflowFact, \{ readonly kind: 'reaches' \}>/.test(read(dataflowLaneFiles[3])),
  dataflowAuthorityOwnsClosure: /reachesFrom|transitiveReaches/.test(read(dataflowLaneFiles[1])) && /least_fixed_point/.test(read(dataflowLaneFiles[1])),
  analysisUsesCanonicalInterfaceFactory: /semanticDataflowInterfaceFromJudgment\(judgment\.dataflow\)/.test(read(dataflowLaneFiles[2])),
  policyNotFoldedIntoGenericDataflow: !/ControllerPolicyRelation|RouteActionPolicyRelation|EffectiveControllerActionPolicy/.test(dataflowText),
};

checks.clean = Object.values(checks).every(Boolean);
console.log(JSON.stringify({
  ...checks,
  reverseImports: reverseImports.map(rel),
  reverseProduction: reverseProduction.map(rel),
  staleProductionExampleRefs: staleProductionExampleRefs.map(rel),
}, null, 2));
if (!checks.clean) process.exit(1);

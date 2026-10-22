const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const files = {
  lowering: fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts'), 'utf8'),
  projectionInputs: fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionInputs.ts'), 'utf8'),
  authority: fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationAuthority.ts'), 'utf8'),
  deriver: fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/type-derivation/routeResponseDeriver.ts'), 'utf8'),
  extractor: fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/type-derivation/route-response/shapeExtractor.ts'), 'utf8'),
  contribution: fs.readFileSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/responseContribution.ts'), 'utf8'),
};
const checks = [
  ['manifest type lowering uses the existing semantic type deriver', files.lowering.includes('SemanticTypeDeriver.derive(resources, models, interner, routes)')],
  ['semantic type authority owns route response derivation', files.authority.includes('deriveRouteResponseTypes')],
  ['route response deriver consumes the existing shape extractor', files.deriver.includes('extractRouteResponseShape(route)')],
  ['active response shape extractor reads canonical upstream responseProjection', files.extractor.includes('route.binding.responseProjection')],
  ['active response shape extractor reads the existing method response product result', files.extractor.includes('projection.product.result')],
  ['active response shape extractor uses canonical resource cardinality', files.extractor.includes("result.cardinality.kind === 'collection'")],
  ['active response shape extractor does not read the legacy flat route.response field', !files.extractor.includes('route.response')],
  ['active response shape extractor does not inspect ResponseDescriptor kinds', !files.extractor.includes('response.kind') && !files.extractor.includes('ResponseDescriptor')],
  ['request response contribution rejects blocked projection before legacy descriptor access', files.contribution.includes("case 'controller_response_projection_blocked':") && !files.contribution.includes('route.binding.response;')],
  ['active manifest lowering retains exact RouteSemanticFlow objects from the manifest', files.projectionInputs.includes('manifest.ast.ast.routeFlows')],
  ['no new semantic foundation dependency is introduced', !Object.values(files).some(source => source.includes('semantic/foundation'))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const passed = checks.filter(([, ok]) => ok).length;
console.log(`RESULT ${passed}/${checks.length}`);
process.exitCode = passed === checks.length ? 0 : 1;

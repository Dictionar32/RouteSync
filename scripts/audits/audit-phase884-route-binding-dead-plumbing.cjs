const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const routeScanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts'), 'utf8');
const producer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts'), 'utf8');
const sourceScanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts'), 'utf8');

const assertions = {
  routeScannerHasNoModelNamesParameter: !/modelNames\s*:\s*RelationMembership<string>/.test(routeScanner),
  routeProducerInputHasNoModelNamesParameter: !/modelNames\s*:\s*RelationMembership<string>/.test(producer),
  refineImplicitModelBindingsHasNoModelNamesParameter: !/function refineImplicitModelBindings\([\s\S]*?modelNames\s*:\s*RelationMembership<string>/.test(producer),
  routeScannerDoesNotForwardModelNames: !/routeProducerInputFromRouteBoundary\([^)]*modelNames/.test(routeScanner),
  sourceAstScannerDoesNotForwardModelNamesToRouteScanner: !/RouteScanner\.scanCanonicalBundle\([^)]*modelNames/.test(sourceScanner),
  implicitBindingRefinementStillUsesControllerAction: /refineImplicitModelBindings\(route\.identity\.parameters\.all, controllerAction\)/.test(producer),
};

const zeroByteLegacyFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && fs.statSync(full).size === 0) zeroByteLegacyFiles.push(path.relative(root, full));
  }
}
walk(path.join(root, 'packages'));

const pass = Object.values(assertions).every(Boolean) && zeroByteLegacyFiles.length >= 203;
const report = {
  phase: 884,
  title: 'route binding dead plumbing upstream cutover',
  status: pass ? 'PASS' : 'FAIL',
  classification: {
    modelNames: 'DEAD_PLUMBING',
    implicitModelBindingRefinement: 'SEMANTIC_ENRICHMENT',
    routeParameterAuthority: 'UPSTREAM_IDENTITY_PARAMETERS',
  },
  assertions,
  zeroByteLegacyFiles: zeroByteLegacyFiles.length,
  deletedFiles: 0,
  recommendation: 'Keep implicit model binding refinement because it enriches canonical route parameters from controller action semantics; remove modelNames plumbing because the refinement never consumes it.'
};
fs.writeFileSync(path.join(root, 'scripts/audits/phase884-route-binding-dead-plumbing.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
process.exit(pass ? 0 : 1);

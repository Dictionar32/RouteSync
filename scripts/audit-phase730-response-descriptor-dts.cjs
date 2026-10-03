const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const response = fs.readFileSync(path.join(root, 'packages/core/src/types/domain/responseDescriptors.ts'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const scriptKeys = Object.keys(pkg.scripts);
const duplicateKeys = scriptKeys.filter((key, index) => scriptKeys.indexOf(key) !== index);
const phase728Count = (pkg.scripts['audit:phase728-type-expression-variant-boundary'] ? 1 : 0);

const checks = {
  voidDescriptorHasCanonicalContext: response.includes('const descriptor: VoidResponseDescriptor = {'),
  voidAnalysisCarriesRouteNameType: response.includes('toAnalysis: (routeName: RouteName): VoidRouteResponseAnalysis'),
  voidBodyCarriesPrimitiveBody: response.includes('toResponseBody: (): PrimitiveBody'),
  duplicatePhase728ScriptRemoved: phase728Count === 1 && duplicateKeys.length === 0,
  noVoidDescriptorPrimitiveStringInferenceWorkaround: !response.includes("primitiveType: 'void' as const"),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
console.log(JSON.stringify({ phase: 730, checks, failed, pass: failed.length === 0 }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);

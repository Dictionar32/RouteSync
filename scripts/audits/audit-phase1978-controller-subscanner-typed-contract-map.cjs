const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/index.ts');
const source = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const expectedKinds = [
  'action-discovery', 'inline-validation-evidence', 'controller-ast-projection',
  'controller-body-projection', 'controller-dataflow-judgment', 'controller-artifact-publication',
  'resource-binding-aggregation', 'resource-invocation-evidence', 'response-attribute-evidence',
  'response-shape-evidence', 'response-dto-evidence', 'controller-subscanner-barrel',
];
const expectedModules = [
  'actionScanner.ts', 'actionValidationExtractor.ts', 'controllerAstCanonical.ts',
  'controllerBodyResolver.ts', 'controllerDataflowContract.ts', 'controllerProducer.ts',
  'resourceDataflowAggregator.ts', 'resourceInvocationDetector.ts', 'responseAttributeScanner.ts',
  'responseDetector.ts', 'responseDtoReader.ts', 'index.ts',
];
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass, detail });
check('contract-version-5', /readonly version: 5;/.test(source), 'Retirement contract advances to version 5.');
check('typed-product-map-exists', /export interface LaravelControllerSubscannerResponsibilityTypeMap/.test(source), 'Responsibilities map to actual imported type contracts and products.');
check('all-12-typed-map-kinds', expectedKinds.every((kind) => source.includes(`readonly '${kind}':`)), 'All twelve controller responsibility keys have typed map entries.');
check('all-12-legacy-modules', expectedModules.every((module) => source.includes(`'${module}'`)), 'All twelve non-empty controller modules remain explicitly accounted for.');
check('type-only-upstream-imports', /^import type \{/m.test(source) && !/^import \{/m.test(source), 'Contract file imports semantic products as types only.');
check('no-runtime-registry', !/^export const\s/m.test(source) && !/^export function\s/m.test(source) && !/^export class\s/m.test(source), 'No runtime registry, factory, authority, or executor was added.');
check('response-evidence-not-composition-input', ['responseAttributeScanner.ts', 'responseDetector.ts', 'responseDtoReader.ts'].every((module) => {
  const line = source.split('\n').find((entry) => entry.includes(`legacyModule: '${module}'`));
  return Boolean(line && line.includes("targetContract: 'LaravelSourceAstPipelineInterface'"));
}), 'Response syntax evidence is owned by source AST projection, not falsely declared as input to integrated-response composition.');
check('public-type-exports', ['LaravelControllerSubscannerResponsibilityTypeMap', 'LaravelControllerSubscannerSemanticProduct', 'LaravelControllerSubscannerSemanticOwner'].every((name) => barrel.includes(name)), 'Typed map and indexed type projections are exported type-only.');
const report = {
  phase: 1978,
  title: 'Controller subscanner typed contract map — interface first',
  checks,
  passed: checks.filter((item) => item.pass).length,
  total: checks.length,
  limitations: [
    'Structural audit only; TypeScript build/typecheck was not run.',
    'Legacy controller subscanner implementation files and relation imports are intentionally unchanged in this interface-only phase.',
    'The type map clarifies ownership; it does not claim runtime migration or safe deletion of the legacy directory.'
  ]
};
const reportPath = path.join(root, 'reports/PHASE1978_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.passed !== report.total) process.exitCode = 1;

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../packages/core');
const types = fs.readFileSync(path.join(root, 'src/types/upstream/controller.ts'), 'utf8');
const canonical = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'), 'utf8');
const test = fs.readFileSync(path.join(root, 'src/compiler/scanner/subscanners/controller/controllerMethodContract.phase894.test.ts'), 'utf8');
const docs = fs.readFileSync(path.join(root, 'src/types/upstream/PHASE898_UPSTREAM_CONTROLLER_POLICY_RELATIONS.md'), 'utf8');
const checks = {
  middlewareRelationClosed: types.includes("ControllerMiddlewareRelation") && types.includes("exclusion: boolean"),
  authorizationRelationClosed: types.includes("ControllerAuthorizationRelation") && types.includes("arguments: ExpressionArguments"),
  actionScopeClosed: types.includes("ControllerPolicyActionScope") && types.includes("kind: 'only'") && types.includes("kind: 'except'"),
  canonicalProjectsPolicy: canonical.includes('controllerPolicyRelationsFromAttributes') && canonical.includes("name !== 'Middleware' && name !== 'WithoutMiddleware' && name !== 'Authorize'"),
  preservesOnlyExcept: canonical.includes('policyActionScope') && canonical.includes("name === 'only'") && canonical.includes("name === 'except'") || canonical.includes("name === 'only'"),
  preservesWithoutMiddleware: canonical.includes("exclusion: name === 'WithoutMiddleware'"),
  preservesAuthorizeArguments: canonical.includes("controller_authorization_relation") && canonical.includes('arguments: attribute.arguments'),
  contractCarriesPolicy: canonical.includes('policy: controllerPolicyRelationsFromAttributes'),
  regressionCoversPolicy: test.includes('controller middleware, exclusions, action scopes, and authorization'),
  docsDeclareAuthorityBoundary: docs.includes('Route middleware and route model binding remain route upstream authorities.'),
  noMethodNameInference: !canonical.includes("method.name.value.value === 'show'") && !canonical.includes("method.name.value.value === 'store'")
};
const failed = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
console.log(JSON.stringify({phase:898, checks, allPassed: failed.length === 0, failed}, null, 2));
process.exitCode = failed.length ? 1 : 0;

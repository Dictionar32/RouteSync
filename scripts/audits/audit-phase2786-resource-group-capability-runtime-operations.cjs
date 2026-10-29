const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
let passed = 0;
let failed = 0;
const check = (name, condition) => {
  if (condition) {
    passed += 1;
    process.stdout.write(`PASS ${name}\n`);
  } else {
    failed += 1;
    process.stderr.write(`FAIL ${name}\n`);
  }
};

const authority = read('packages/core/src/types/upstream/resourceGroupCapabilityAuthority.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const barrel = read('packages/core/src/index.ts');
const contract = read('packages/core/src/types/upstream/resourceGroupCapability.ts');
const algebra = read('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));

check('upstream collections contract remains empty', collections.length === 0);
check('resource group capability authority imports the canonical algebra', /from '\.\/resourceGroupCapabilityAlgebra'/.test(authority));
check('resource group authority remains a typed frozen operation object', /export const resourceGroupCapabilityAuthority:\s*ResourceGroupCapabilityAlgebraInterface\s*=\s*Object\.freeze\(/.test(authority));
check('route-to-capability operation has an explicit interface', /export interface ResourceGroupCapabilityAuthorityOperationsInterface/.test(authority));
check('route-to-capability operation input and output are explicitly typed', /readonly fromRoutes:[\s\S]*?readonly RouteSemanticFlow\[\][\s\S]*?readonly ResourceGroupCapabilityContract\[\]/.test(authority));
check('public runtime operation object is explicitly typed and frozen', /export const resourceGroupCapabilityAuthorityOperations:\s*ResourceGroupCapabilityAuthorityOperationsInterface\s*=\s*Object\.freeze\(/.test(authority));
check('legacy exported function declaration has been removed', !/^export\s+(?:async\s+)?function\s+resourceGroupCapabilitiesFromRoutes\b/m.test(authority));
check('private compatibility implementation is a typed arrow operation', /const resourceGroupCapabilitiesFromRoutesImpl\s*=\s*\([\s\S]*?readonly ResourceGroupCapabilityContract\[\]\s*=>/.test(authority));
check('manifest builder imports authority from the implementation module', /import \{ resourceGroupCapabilityAuthority \} from '\.\.\/\.\.\/\.\.\/types\/upstream\/resourceGroupCapabilityAuthority'/.test(builder));
check('manifest builder composes route flows through authority after source AST completion', /if \(projection\.kind !== 'laravel_source_ast_projection_complete'\)/.test(builder) && /resourceGroupCapabilitiesAlgebra\.compose\(completeAst\.ast\.routeFlows\)/.test(builder));
check('resource group slot outcomes retain explicit route/absent/ambiguous ADT', /kind: 'route'/.test(contract) && /kind: 'absent'/.test(contract) && /kind: 'ambiguous'/.test(contract));
check('algebra keeps slot classification in upstream relation algebra', /const slotsFromRoutes/.test(algebra) && /const decision/.test(algebra));
check('public barrel exports the authority object and its operation interface', /export \{ resourceGroupCapabilityAuthority, resourceGroupCapabilityAuthorityOperations \}/.test(barrel) && /export type \{ ResourceGroupCapabilityAuthorityOperationsInterface \}/.test(barrel));
check('no new reasoning primitive was introduced', !/newSemanticReasoningPrimitive|ResourceGroupCapabilityReasoningPrimitive/.test(authority));
check('audit command is registered', packageJson.scripts?.['audit:phase2786-resource-group-capability-runtime-operations'] === 'node scripts/audits/audit-phase2786-resource-group-capability-runtime-operations.cjs');

process.stdout.write(`\nPhase 2786 audit: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exitCode = 1;

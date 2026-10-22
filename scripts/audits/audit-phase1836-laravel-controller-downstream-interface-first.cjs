const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const route = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const resource = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const coreIndex = read('packages/core/src/index.ts');
const checks = [
  ['controller scanner accepts only authority-produced inventory closure receipt', () => /invocationInventory:\s*LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(controller)],
  ['controller artifact keeps AST, action contracts, and invocation judgment correlated', () => /interface LaravelControllerScanArtifact\s*\{[\s\S]*?readonly ast: ControllerAst;[\s\S]*?readonly actions: readonly ControllerActionFlowContract\[\];[\s\S]*?readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface;/.test(controller)],
  ['controller scanner contract version is advanced', () => /readonly contractVersion: 10/.test(controller)],
  ['controller scan judgment carries canonical source project from closed inventory', () => /interface LaravelControllerScanJudgment\s*\{[\s\S]*?readonly sourceProject: SourceProjectIdentity;/.test(controller)],
  ['controller contract defines a downstream consumer boundary', () => controller.includes('downstreamConsumerBoundary') && controller.includes('not-detached-action-arrays-or-legacy-controller-indexes')],
  ['route scanner consumes complete controller scan judgment as its sole project identity source', () => route.includes("import type { LaravelControllerScanJudgment } from './laravelControllerScannerInterface'") && route.includes('readonly controllerScan: LaravelControllerScanJudgment;') && !route.includes('readonly sourceProject: SourceProjectIdentity;')],
  ['route scanner no longer accepts detached controller action arrays', () => !route.includes('controllerActions: readonly ControllerActionFlowContract[]')],
  ['route scanner owns binding authority outside per-operation input', () => route.includes('readonly bindingAuthority: RouteControllerBindingJudgmentAuthority') && !route.match(/export interface LaravelRouteScanInput[\s\S]*?bindingAuthority/)],
  ['route artifact correlates AST, flow, and binding judgment', () => /interface LaravelRouteScanArtifact\s*\{[\s\S]*?readonly ast: RouteAst;[\s\S]*?readonly flow: RouteSemanticFlow;[\s\S]*?readonly binding: RouteControllerBindingJudgment;/.test(route)],
  ['resource scanner consumes complete controller scan judgment as its sole project identity source', () => resource.includes("import type { LaravelControllerScanJudgment } from './laravelControllerScannerInterface'") && resource.includes('readonly controllerScan: LaravelControllerScanJudgment;') && !resource.includes('readonly sourceProject: SourceProjectIdentity;')],
  ['resource input keeps canonical model definitions and binding authority', () => resource.includes('modelDefinitions: readonly ModelDefinition[]') && resource.includes('readonly bindingAuthority: ResourceModelBindingJudgmentAuthority')],
  ['resolved resource artifact correlates AST, definition, and resolved binding judgment while rejected outcomes remain explicit', () => /interface LaravelResourceResolvedArtifact\s*\{[\s\S]*?readonly ast: ResourceAst;[\s\S]*?readonly definition: ResourceDefinition;[\s\S]*?readonly modelBinding: ResolvedResourceModelBindingJudgment;/.test(resource) && /interface LaravelResourceRejectedArtifact/.test(resource)],
  ['route contract remains version 3 and resource judgment contract remains at current version 17', () => /contractVersion: 3/.test(route) && /contractVersion: 17/.test(resource)],
  ['route and resource interfaces avoid semantic/relations dependencies', () => !route.includes('semantic/relations') && !resource.includes('semantic/relations')],
  ['controller interface avoids legacy ControllerActionInfo and RelationIndex', () => !controller.includes('ControllerActionInfo') && !controller.includes('RelationIndex<')],
  ['public core barrel exports controller route and resource interfaces', () => coreIndex.includes('LaravelControllerScannerInterface') && coreIndex.includes('LaravelRouteScannerInterface') && coreIndex.includes('LaravelResourceScannerInterface')],
  ['controller, route, and resource scanner interfaces are all wired in production', () => pipeline.includes('laravelControllerScanner.scan') && pipeline.includes('laravelRouteScanner.scan') && pipeline.includes('laravelResourceScanner.scan') && !pipeline.includes('ControllerScanner.scanCanonicalBundle') && !pipeline.includes('ResourceScanner.scanCanonicalBundle')],
];
let failed = 0;
for (const [name, check] of checks) {
  let passed = false;
  try { passed = Boolean(check()); } catch { passed = false; }
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} PASS\n`);
process.exitCode = failed ? 1 : 0;

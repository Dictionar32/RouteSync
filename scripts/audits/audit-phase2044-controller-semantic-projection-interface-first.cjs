const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const canonicalPath = path.join(root, 'packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/controller.ts');
const canonical = fs.readFileSync(canonicalPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const checks = [
  ['upstream defines a source-correlated ControllerMethodSemanticProjection contract', upstream.includes("readonly kind: 'controller_method_semantic_projection'") && upstream.includes('readonly semantic: ControllerSemanticDataflow;')],
  ['canonical projection builder binds controller, source, response, and semantic dataflow', canonical.includes('controllerMethodSemanticProjectionFromMethod') && canonical.includes('source: tokenSpan(file, method.source)') && canonical.includes('semantic: semantic(method, controllerName, file, response, queries)')],
  ['controller method contract consumes the shared projection', canonical.includes('const semanticDataflow = semanticProjection.semantic;')],
  ['controller action consumes the same shared projection', canonical.includes('semantic: semanticProjection.semantic,')],
  ['Laravel scanner computes the projection once per method', scanner.includes('const semanticProjection = controllerMethodSemanticProjectionFromMethod(method, controllerName, fullPath, response, queries);')],
  ['Laravel scanner passes the same projection to contract and action', scanner.includes('inheritedAttributeAst, semanticProjection)') && scanner.includes('inheritedControllerNames, queries, semanticProjection)')],
  ['legacy method-contract default calls canonical projection with correctly ordered arguments', canonical.includes('semanticProjection: ControllerMethodSemanticProjection = controllerMethodSemanticProjectionFromMethod(method, controllerName, file, response, queries)')],
  ['legacy action default calls canonical projection with correctly ordered arguments', canonical.includes('semanticProjection: ControllerMethodSemanticProjection = controllerMethodSemanticProjectionFromMethod(method, controllerName, file, response, queries)')],
  ['method attributes are projected once before policy derivation', canonical.includes('const attributes = controllerMethodAttributesFromMethod(method, [...controllerInheritedAttributes, ...controllerAttributes], file);') && canonical.includes('controllerPolicyRelationsFromAttributes(attributes,')],
  ['no parallel invocation or response authority is introduced', !canonical.includes('InvocationSemanticAuthorityInterface') && !canonical.includes('ControllerResponseSemanticAuthority')],
  ['existing invocation judgment and integrated response wiring remains present', scanner.includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })') && scanner.includes('responseJudgmentFor(invocationJudgment, declarationEvidence, responseSemanticPipeline)')],
  ['no relation/foundation subscanner is introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/foundation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation'))],
  ['AST/ADT action semantic remains typed as ControllerSemanticDataflow', upstream.includes('readonly semantic: ControllerSemanticDataflow;') && upstream.includes('readonly kind: \'controller_action\';')],
];
let passed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`Phase 2044: ${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;

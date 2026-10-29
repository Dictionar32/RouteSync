'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
const check = (name, condition) => {
  checks.push({ name, pass: Boolean(condition) });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}`);
};
const upstreamBarrel = read('packages/core/src/types/upstream/index.ts');
const cliBarrel = read('packages/cli/src/index.ts');
const cliScan = read('packages/cli/src/manifestScanOperationInterface.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifestAuthority = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const builder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const astPipeline = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const routeSyntax = read('packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const routeParser = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts');
const collections = fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size;
const contractExports = [
  "from './controllerProducerInterface'",
  "from './controllerRuntimeReturnProjectionInterface'",
  "from './laravelControllerInvocationResponseWiringInterface'",
  "from './laravelControllerRequestSemanticBindingInterface'",
  "from './requestProducerInterface'",
  "from './semanticKnowledgeEvidenceAdapterInterface'",
  "from './typeInternerInterface'",
  "from './controllerActionResponseReferenceJudgmentInterface'",
];
check('existing controller/request runtime contracts are explicitly exposed by the upstream barrel', contractExports.every((entry) => upstreamBarrel.includes(entry)));
check('CLI public barrel exports existing manifest composition authority and input contracts', ['ControllerInvocationManifestCompositionInput', 'ControllerInvocationManifestCompositionAuthorityInterface', 'ControllerInvocationManifestCompositionDependencies'].every((name) => cliBarrel.includes(name)));
check('CLI manifest scan operation is interface-first and frozen', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliScan));
check('CLI composition assembles the canonical semantic pipeline without local reasoning fallback', /requestTypeDerivationProductionPipelineAssembler\.assemble\(semanticComposition\)/.test(cliComposition) && /routesync_cli_upstream_semantic_assembly_rejected/.test(cliComposition));
check('manifest authority is a typed runtime operation', /interface ControllerInvocationManifestCompositionAuthorityInterface/.test(manifestAuthority) && /compose:\s*\(input: ControllerInvocationManifestCompositionInput\)/.test(manifestAuthority));
check('manifest builder ADT preserves complete and blocked outcomes', /ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(builder) && /manifest_builder_blocked/.test(builder));
check('source AST pipeline preserves blocked outcome instead of manufacturing an empty projection', /laravel_source_ast_projection_blocked/.test(astPipeline) && /LaravelSourceAstProjectionJudgment/.test(astPipeline));
check('route parser invokes the route-path acceptance operation contract', /routePathTokenAcceptanceOperation\.accepts\(at, method\)/.test(routeParser));
check('route-path ADT owns its domain continuation', /continueForAcceptance:\s*<Output>/.test(routeSyntax) && /continuation\[expectation\]\(actual\)/.test(routeSyntax));
check('route-path expectation is a closed method switch rather than generic relation dispatch', (() => { const s = routeSyntax.indexOf('const routePathTokenExpectation ='); const e = routeSyntax.indexOf('const createRoutePathTokenFact', s); const p = routeSyntax.slice(s, e); return s >= 0 && e > s && /switch \(method\)/.test(p) && !/catalogRequired|relationFirstOr|relationVariantFold/.test(p); })());
check('upstream collections remains empty by contract', collections === 0);
const failures = checks.filter((c) => !c.pass);
console.log(`\nPhase 2821 runtime/upstream barrel audit: ${checks.length - failures.length}/${checks.length} checks passed.`);
console.log('SCOPE: structural source assertions only; not a TypeScript build, full test suite, or CLI end-to-end execution.');
if (failures.length) process.exitCode = 1;

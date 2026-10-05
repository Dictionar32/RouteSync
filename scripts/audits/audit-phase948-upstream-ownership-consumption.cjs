const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const run = (args) => execFileSync('rg', args, { cwd: root, encoding: 'utf8', stdio: ['ignore','pipe','ignore'] });
const files = (q) => {
  try { return run(['-l', q, '--glob', 'packages/core/src/**/*.ts']).trim().split('\n').filter(Boolean); } catch { return []; }
};
const exists = p => fs.existsSync(path.join(root, p));
const production = (q) => files(q).filter(f => !f.includes('/__tests__/') && !f.endsWith('.test.ts') && !f.endsWith('.spec.ts'));
let reverseImports = []; try { reverseImports = run(['-n', 'from .*compiler/|from .*scanner/|from .*graph/', '--glob', 'packages/core/src/types/upstream/**/*.ts']).trim().split('\n').filter(Boolean); } catch {}
let kernelCompilerImports = []; try { kernelCompilerImports = run(['-n', 'compiler/', '--glob', 'packages/core/src/semantic/kernel/**/*.ts']).trim().split('\n').filter(Boolean); } catch {}
let upstreamKernelImports = []; try { upstreamKernelImports = run(['-l', 'semantic/kernel', '--glob', 'packages/core/src/types/upstream/**/*.ts']).trim().split('\n').filter(Boolean); } catch {}
const result = {
  canonicalUpstreamExists: exists('packages/core/src/types/upstream/index.ts'),
  forbiddenPhysicalUpstreamAbsent: !exists('packages/core/src/upstream'),
  reverseImportsFromUpstream: reverseImports,
  noReverseImports: reverseImports.length === 0,
  kernelCompilerImports,
  noKernelCompilerImports: kernelCompilerImports.length === 0,
  upstreamDependsOnKernel: upstreamKernelImports,
  policyRelations: {
    route: production('RouteActionPolicyRelation'),
    controller: production('ControllerActionPolicyRelation'),
    routeProjection: production('routeActionPolicyRelationsFromEffectivePolicy'),
    controllerProjection: production('controllerActionPolicyRelations'),
    sourceModelConsumer: production('sourceModelReferenceIndexFromCatalog'),
    graphPolicyFilter: production('isStructuralSemanticRelation'),
  },
  dataflow: {
    inputAdapter: production('createSemanticDataflowInput'),
    judgmentAuthority: production('createSemanticDataflowJudgment'),
    interfaceFactory: production('semanticDataflowInterfaceFromJudgment'),
    analysisConsumer: production('astAnalysisInterface'),
  },
  ecommerce: {
    maintainedFixtureExists: exists('packages/sdk/tests/fixtures/ecommerce-shop-source'),
    oldMisspelledExampleAbsent: !exists('examples/ecomerce-shop-source'),
    oldCorrectedExampleAbsent: !exists('examples/ecommerce-shop-source'),
  },
};
result.policyRelations.endToEnd = result.policyRelations.routeProjection.length > 0 && result.policyRelations.controllerProjection.length > 0 && result.policyRelations.sourceModelConsumer.length > 0 && result.policyRelations.graphPolicyFilter.length > 0;
result.dataflow.endToEnd = result.dataflow.inputAdapter.length > 0 && result.dataflow.judgmentAuthority.length > 0 && result.dataflow.interfaceFactory.length > 0 && result.dataflow.analysisConsumer.length > 0;
result.clean = result.noReverseImports && result.noKernelCompilerImports && result.policyRelations.endToEnd && result.dataflow.endToEnd && result.ecommerce.maintainedFixtureExists && result.ecommerce.oldMisspelledExampleAbsent && result.ecommerce.oldCorrectedExampleAbsent;
console.log(JSON.stringify(result, null, 2));

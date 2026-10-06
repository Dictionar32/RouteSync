const fs = require('fs');
const path = require('path');

const core = path.resolve(__dirname, '..', '..');
const root = path.resolve(core, '..', '..');
const read = p => fs.readFileSync(path.join(core, p), 'utf8');
const walk = dir => {
  const out = [];
  for (const ent of fs.readdirSync(path.join(core, dir), { withFileTypes: true })) {
    const rel = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(rel));
    else if (ent.isFile() && ent.name.endsWith('.ts')) out.push(rel);
  }
  return out;
};
const productionTypes = walk('src/types').filter(p => !p.includes(`${path.sep}__tests__${path.sep}`));
const productionSemantic = walk('src/semantic');
const allProduction = [...productionTypes, ...productionSemantic];
const compilerImport = /(?:from\s+['"][^'"]*compiler\/|require\(\s*['"][^'"]*compiler\/)/;
const compilerTypeExpression = /compiler\/domain\/common\/typeExpressionSemantic(?:Type|Relations)/;
const checks = {
  typeVocabularyCanonicalUpstream: read('src/types/upstream/typeVocabulary.ts').includes('export type TypeExpression'),
  canonicalTypeExpressionLoweringDomain: fs.existsSync(path.join(core, 'src/types/domain/typeExpressionSemanticType.ts')),
  canonicalTypeExpressionRelationsDomain: fs.existsSync(path.join(core, 'src/types/domain/typeExpressionSemanticRelations.ts')),
  domainNoCompilerImports: productionTypes.filter(p => compilerImport.test(read(p))).map(p => p),
  semanticNoCompilerTypeExpressionImport: productionSemantic.filter(p => compilerTypeExpression.test(read(p))).map(p => p),
  compilerFacadeOnly: read('src/compiler/domain/common/typeExpressionSemanticType.ts').includes("export { typeExpressionToSemanticType } from '../../../types/domain/typeExpressionSemanticType';"),
  compilerRelationsFacadeOnly: read('src/compiler/domain/common/typeExpressionSemanticRelations.ts').includes("export * from '../../../types/domain/typeExpressionSemanticRelations';"),
  publicTypeExpressionUsesDomain: read('src/index.ts').includes("export { typeExpressionToSemanticType } from './types/domain/typeExpressionSemanticType';"),
  dataFlowGeneric: read('src/types/dataflow/dataFlowInterface.ts').includes('DataFlowInterface<Input, State, Node>') && !/Laravel|RouteManifest|Controller|Resource/.test(read('src/types/dataflow/dataFlowInterface.ts')),
  dependencyBoundaryGeneric: read('src/types/interfaces/interfaceDependencyBoundary.ts').includes('InterfaceDependencyBoundary<Upstream, Downstream>') && !/Laravel|RouteManifest|Controller|Resource/.test(read('src/types/interfaces/interfaceDependencyBoundary.ts')),
  legacyProductionEmpty: allProduction.every(p => !/StaticLaravelScanner|scanner\/upstream/.test(read(p))),
  ecommerceFixturePresent: fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
checks.domainNoCompilerImports = checks.domainNoCompilerImports;
const failed = Object.entries(checks).filter(([,v]) => Array.isArray(v) ? v.length !== 0 : !v).map(([k]) => k);
const result = { phase: 1117, direction: 'upstream => wiring => interface => downstream', checks, failed, passed: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '..', '..');
const read = p => fs.readFileSync(path.join(repo,p),'utf8');
const graphImpl = ['packages/core/src/graph/service/graphAssembler.ts','packages/core/src/graph/ServiceGraphBuilder.ts','packages/core/src/graph/service/manifestGraphCompiler.ts'];
const serviceTypes = read('packages/core/src/types/semantic/serviceGraphTypes.ts');
const modelTypes = read('packages/core/src/types/semantic/modelGraphTypes.ts');
const checks = {
  graphAssemblerOwnsGraphRelationImport: /import type \{ GraphEdgeRelation \} from ['"]\.\/graphEdgeRelation['"]/.test(read(graphImpl[0])),
  serviceGraphTypesOwnsGraphRelationImport: /from ['"]\.\.\/\.\.\/graph\/service\/graphEdgeRelation['"]/.test(serviceTypes),
  modelGraphTypesOnlyCompatibilityAlias: /@deprecated Compatibility aliases/.test(modelTypes),
  graphImplementationNoSemanticGraphRelationAliasImport: graphImpl.every(p => !/GraphEdgeRelation[^\n]*from ['"].*types\/semantic/.test(read(p))),
};
const violations = Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
const result={phase:1128,direction:'upstream => wiring => interface => downstream',checks,violations,passed:violations.length===0};
console.log(JSON.stringify(result,null,2));
process.exit(result.passed?0:1);

const fs = require('fs');
const path = require('path');

const core = path.resolve(__dirname, '../..');
const adapter = fs.readFileSync(path.join(core, 'src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts'), 'utf8');
const controller = fs.readFileSync(path.join(core, 'src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts'), 'utf8');
const route = fs.readFileSync(path.join(core, 'src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts'), 'utf8');
const dataflow = fs.readFileSync(path.join(core, 'src/types/upstream/semanticDataflow.ts'), 'utf8');

const checks = {
  adapterRequiresProducer: /producer:\s*'route' \| 'controller'/.test(adapter),
  adapterUsesProducerForLineage: /semanticDataflowFactWithLineage\(canonical, producer\)/.test(adapter),
  controllerExplicitProducer: /createSemanticDataflowInput\([^;]*'controller'\);/s.test(controller),
  routeExplicitProducer: /createSemanticDataflowInput\([\s\S]*?model,\s*'route',\s*\);/.test(route),
  noHardcodedControllerLineage: !/semanticDataflowFactWithLineage\(canonical, 'controller'\)/.test(adapter),
  lineageProducerCatalogClosed: /'request' \| 'route' \| 'controller' \| 'resource'/.test(dataflow),
};

const violations = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
const result = {
  phase: 1124,
  direction: 'upstream => wiring => interface => downstream',
  checks,
  violations,
  passed: violations.length === 0,
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exit(1);

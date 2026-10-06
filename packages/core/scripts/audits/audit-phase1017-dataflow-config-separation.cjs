const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const iface = read('src/types/upstream/semanticDataflowInterface.ts');
const authority = read('src/types/upstream/semanticDataflowAuthority.ts');
const config = read('src/compiler/analysis/dataflow/dataFlowConfigInterface.ts');
const index = read('src/compiler/analysis/dataflow/index.ts');
const report = {
  semanticUsesDataFlowInterface: /extends DataFlowInterface<SemanticDataflowInput, SemanticDataflowJudgment, SemanticDataflowIdentity>/.test(iface),
  semanticDoesNotExtendConfig: !/DataFlowConfigInterface/.test(iface),
  authorityDoesNotImplementSourcePolicy: !/isSource:/.test(authority),
  authorityDoesNotImplementSinkPolicy: !/isSink:/.test(authority),
  authorityDoesNotImplementBarrierPolicy: !/isBarrier:/.test(authority),
  configHasSource: /isSource/.test(config),
  configHasSink: /isSink/.test(config),
  configHasAdditionalStep: /isAdditionalFlowStep/.test(config),
  configHasBarrier: /isBarrier/.test(config),
  configFactoryPresent: /createDataFlowConfig/.test(config),
  analysisExportsConfig: /dataFlowConfigInterface/.test(index),
};
report.clean = Object.values(report).every(Boolean);
console.log(JSON.stringify(report, null, 2));
if (!report.clean) process.exit(1);

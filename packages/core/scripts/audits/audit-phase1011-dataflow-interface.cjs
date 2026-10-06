const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const iface = read('src/compiler/analysis/dataflow/controlFlowDataFlowInterface.ts');
const impl = read('src/compiler/analysis/DataFlowAnalysis.ts');
const index = read('src/compiler/analysis/dataflow/index.ts');
const result = {
  dataFlowInterfacePresent: /export type ControlFlowDataFlowInterface<\s*T\s*>/.test(iface),
  forwardOperationPresent: /readonly analyze:/.test(iface),
  backwardOperationPresent: /readonly analyzeBackward:/.test(iface),
  classImplementsInterface: /class DataFlowAnalysis<T> implements ControlFlowDataFlowInterface<T>/.test(impl),
  interfaceExported: /ControlFlowDataFlowInterface/.test(index),
  semanticAuthoritySeparated: /ControlFlowDataFlowInterface/.test(iface) && !/SemanticDataflow/.test(iface),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);

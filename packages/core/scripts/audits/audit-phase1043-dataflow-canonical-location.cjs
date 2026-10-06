const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const src = path.join(root, 'src');
const read = p => fs.readFileSync(p, 'utf8');
const dataflow = read(path.join(src, 'types/dataflow/dataFlowInterface.ts'));
const dataflowIndex = read(path.join(src, 'types/dataflow/index.ts'));
const upstreamIndex = read(path.join(src, 'types/upstream/index.ts'));
const semantic = read(path.join(src, 'types/upstream/semanticDataflow.ts'));
const semanticAuthority = read(path.join(src, 'types/upstream/semanticDataflowAuthority.ts'));
const rootIndex = read(path.join(src, 'index.ts'));
const upstreamDir = path.join(src, 'types/upstream');
const upstreamFiles = fs.readdirSync(upstreamDir).filter(f => f.endsWith('.ts'));
const result = {
  canonicalDataFlowInterfaceInDataflow: /export type DataFlowInterface/.test(dataflow),
  dataflowExportsCanonical: /DataFlowInterface/.test(dataflowIndex),
  upstreamIndexDoesNotExportDataFlow: !/dataFlowInterface/.test(upstreamIndex),
  upstreamHasNoDataFlowFile: !upstreamFiles.includes('dataFlowInterface.ts'),
  semanticAuthorityDoesNotConsumeDataflow: !/DataFlowInterface/.test(semanticAuthority),
  publicRootExportsDataflow: /from '\.\/types\/dataflow'/.test(rootIndex),
  projectionRemainsDownstream: /extends InterfaceDependencyBoundary/.test(read(path.join(src,'types/dataflow/dataFlowProjectionInterface.ts'))) && /DataFlowInterface<Input, State, Node>/.test(read(path.join(src,'types/dataflow/dataFlowProjectionInterface.ts'))),
};
result.passed = Object.values(result).every(v => v === true);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const graphImpl = read('src/graph/ServiceGraphBuilder.ts');
const graphContract = read('src/graph/ServiceGraphBuilderInterface.ts');
const irImpl = read('src/compiler/ir/SemanticDataflowIRProjection.ts');
const irContract = read('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts');
const index = read('src/index.ts');
const checks = {
  graphInterfaceSeparated: exists('src/graph/ServiceGraphBuilderInterface.ts') && /export interface ServiceGraphBuilderInterface/.test(graphContract) && !/export interface ServiceGraphBuilderInterface/.test(graphImpl),
  graphImplementationIsConcrete: /export class ServiceGraphBuilder implements ServiceGraphBuilderInterface/.test(graphImpl),
  graphPublicExportUsesContractModule: /export type \{ ServiceGraphBuilderInterface \} from '\.\/graph\/ServiceGraphBuilderInterface'/.test(index),
  irInterfaceSeparated: exists('src/compiler/ir/SemanticDataflowIRProjectionInterface.ts') && /export interface SemanticDataflowIRProjectionInterface/.test(irContract) && !/export interface SemanticDataflowIRProjectionInterface/.test(irImpl),
  irImplementationConsumesContract: /import type \{ SemanticDataflowIRProjectionInterface \} from '\.\/SemanticDataflowIRProjectionInterface'/.test(irImpl),
  irPublicExportUsesContractModule: /export type \{ SemanticDataflowIRProjectionInterface \} from '\.\/compiler\/ir\/SemanticDataflowIRProjectionInterface'/.test(index),
  graphConcreteStillNotRootExported: !/export\s*\{\s*ServiceGraphBuilder\s*\}/.test(index),
};
const result = { phase: 1060, checks, clean: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);

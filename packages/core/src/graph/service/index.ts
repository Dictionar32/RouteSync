/**
 * index.ts
 *
 * Sub-domain exports for service graph builder components.
 *
 * @module core/graph/service
 */

export {
  detectExecutionLayer,
  buildServiceNode,
  buildControllerNode,
  buildModelNode
} from './nodeFactories';
export { assembleServiceGraph } from './graphAssembler';
export { compileGraphFromManifest, type GraphBuilderContext } from './manifestGraphCompiler';

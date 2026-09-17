/**
 * SemanticResolutionKernel.ts
 *
 * Active Consumer: Orchestrator for Semantic Resolution Kernel.
 * Consumes sub-domain modules and executes resolution workflow.
 *
 * @module core/semantic
 */

import type { SemanticResolution } from '../types/domain/semanticResolution';
import { unknownResolution } from './semanticResolutionSupport';
import type {
  ResolverPlugin,
  SemanticResolutionKernelContract,
  ResolutionContext,
  ResolverMeta,
  ModelNode,
  ModelNodeInput
} from './types';
import { CycleDetector } from './types';
import { verifyModelNode } from './modelNodes';
import { SymbolTable } from './SymbolTable';
import {
  mapSqlTypeToTs,
  mapCastToTs,
  buildResolutionContext,
  createDefaultPlugins
} from './kernel';

export { mapSqlTypeToTs, mapCastToTs };

export type { ModelGraphInput, VerifiedModelGraph } from './VerifiedModelGraph';
export { verifyModelGraph } from './VerifiedModelGraph';

export class SemanticResolutionKernel implements SemanticResolutionKernelContract {
  private models: ModelNode[];
  private plugins: ResolverPlugin[];
  private cycleDetector: CycleDetector;
  private symbolTable: SymbolTable;

  constructor(inputs: readonly ModelNodeInput[] = [], private resources: readonly { readonly name: string }[] = []) {
    this.models = inputs.map(verifyModelNode);
    this.cycleDetector = new CycleDetector();
    this.symbolTable = new SymbolTable(this.models);
    this.plugins = createDefaultPlugins();
  }

  public getModels(): ModelNode[] {
    return this.models;
  }

  public loadGraph(graph: VerifiedModelGraph): void {
    const existingNames = new Set(this.models.map(model => model.name));
    const additions = graph.models.filter(model => !existingNames.has(model.name));
    if (additions.length === 0) return;
    this.models.push(...additions);
    this.symbolTable = new SymbolTable(this.models);
  }

  public resolve(meta: ResolverMeta, contextModel?: ModelNode): SemanticResolution {
    if (meta.kind === 'unknown') {
      return unknownResolution('SemanticResolutionKernel', 'No metadata available', 'metadata', 'invalid_boundary_input');
    }

    const context: ResolutionContext = buildResolutionContext(
      this.models,
      this.resources,
      this,
      this.cycleDetector,
      this.symbolTable,
      contextModel
    );

    for (const plugin of this.plugins) {
      if (plugin.canResolve(meta)) {
        return plugin.resolve(meta, context);
      }
    }

    return unknownResolution('SemanticResolutionKernel', `Unsupported kind: ${meta.kind}`, meta.kind, 'unsupported_syntax');
  }

  public mapSqlTypeToTs(sqlType: string): string {
    return mapSqlTypeToTs(sqlType);
  }

  public mapCastToTs(castType: string, baseType: string): string {
    return mapCastToTs(castType, baseType);
  }
}

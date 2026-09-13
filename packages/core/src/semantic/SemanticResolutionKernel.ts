/**
 * SemanticResolutionKernel.ts
 *
 * Active Consumer: Orchestrator for Semantic Resolution Kernel.
 * Consumes sub-domain modules and executes resolution workflow.
 *
 * @module core/semantic
 */

import type { SemanticResolution } from '../types/contract';
import type {
  ResolverPlugin,
  SemanticResolutionKernelContract,
  ResolutionContext,
  ResolverMeta,
  ModelNode
} from './types';
import { CycleDetector } from './types';
import { SymbolTable } from './SymbolTable';
import {
  mapSqlTypeToTs,
  mapCastToTs,
  buildResolutionContext,
  createDefaultPlugins
} from './kernel';

export { mapSqlTypeToTs, mapCastToTs };

export class SemanticResolutionKernel implements SemanticResolutionKernelContract {
  private plugins: ResolverPlugin[];
  private cycleDetector: CycleDetector;
  private symbolTable: SymbolTable;

  constructor(private models: ModelNode[] = [], private resources: unknown[] = []) {
    this.cycleDetector = new CycleDetector();
    this.symbolTable = new SymbolTable(this.models);
    this.plugins = createDefaultPlugins();
  }

  public getModels(): ModelNode[] {
    return this.models;
  }

  public loadGraph(graph: { models?: Record<string, ModelNode> | { readonly entries: readonly { readonly name: string; readonly model: ModelNode }[] } }) {
    if (graph && graph.models) {
      let changed = false;
      const modelEntries: readonly (readonly [string, ModelNode])[] = 'entries' in graph.models && Array.isArray(graph.models.entries)
        ? graph.models.entries.map((e: { readonly name: string; readonly model: ModelNode }) => [e.name, e.model] as const)
        : Object.entries(graph.models as Record<string, ModelNode>);

      for (const [name, node] of modelEntries) {
        if (!node || typeof node !== 'object' || !('name' in node)) {
          continue;
        }
        if (!this.models.some(m => m.name === name)) {
          this.models.push(node);
          changed = true;
        }
      }
      if (changed) this.symbolTable = new SymbolTable(this.models);
    }
  }

  public resolve(meta: ResolverMeta, contextModel?: unknown): SemanticResolution {
    if (!meta || meta.kind === 'unknown') {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'SemanticResolutionKernel', rule: 'No metadata available' }]
      };
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

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'SemanticResolutionKernel', rule: `Unsupported kind: ${meta.kind}` }]
    };
  }

  public mapSqlTypeToTs(sqlType: string): string {
    return mapSqlTypeToTs(sqlType);
  }

  public mapCastToTs(castType: string, baseType: string): string {
    return mapCastToTs(castType, baseType);
  }
}

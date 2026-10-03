/**
 * SemanticResolutionKernel.ts
 *
 * Active Consumer: Orchestrator for Semantic Resolution Kernel.
 * Consumes sub-domain modules and executes resolution workflow.
 *
 * @module core/semantic
 */

import type { SemanticResolution } from '../types/domain/semanticResolution';
import type { VerifiedModelGraph } from './VerifiedModelGraph';
import { indeterminateResolution } from './semanticResolutionSupport';
import type {
  ResolverPlugin,
  SemanticResolutionKernelContract,
  ResolutionContext,
  ResolverMeta,
  ModelNode,
  ModelNodeInput
} from './types';
import { createCycleDetector, type CycleDetector } from './CycleDetector';
import type { ResolutionScope } from './resolutionScope';
import { verifyModelNode } from './modelNodes';
import { createSymbolTable, type SymbolTable } from './SymbolTable';
import {
  mapSqlTypeToTs,
  mapCastToTs,
  buildResolutionContext,
  createDefaultPlugins,
  relationFirst,
  relationProject,
  relationSelect,
  relationOptionFold,
} from './kernel';
import { relationEqual } from './kernel/semanticRelations';

export { mapSqlTypeToTs, mapCastToTs };

export type { ModelGraphInput } from './VerifiedModelGraph';
export { verifyModelGraph } from './VerifiedModelGraph';

export class SemanticResolutionKernel implements SemanticResolutionKernelContract {
  private models: readonly ModelNode[];
  private plugins: readonly ResolverPlugin[];
  private cycleDetector: CycleDetector;
  private symbolTable: SymbolTable;

  constructor(inputs: readonly ModelNodeInput[] = [], private resources: readonly { readonly name: string }[] = []) {
    this.models = relationProject(inputs, verifyModelNode);
    this.cycleDetector = createCycleDetector();
    this.symbolTable = createSymbolTable(this.models);
    this.plugins = createDefaultPlugins();
  }

  public getModels(): readonly ModelNode[] {
    return this.models;
  }

  public loadGraph(graph: VerifiedModelGraph): void {
    const additions = relationSelect(
      graph.models,
      model => relationOptionFold(
        relationFirst(this.models, existing => relationEqual(existing.definition.identity.name.value, model.definition.identity.name.value)),
        () => true,
        () => false,
      ),
    );
    this.models = Object.freeze([...this.models, ...additions]);
    this.symbolTable = createSymbolTable(this.models);
  }

  public resolve(meta: ResolverMeta, scope: ResolutionScope): SemanticResolution {
    const context: ResolutionContext = buildResolutionContext(
      this.models,
      this.resources,
      this,
      this.cycleDetector,
      this.symbolTable,
      scope
    );

    const plugin = relationFirst(this.plugins, candidate => candidate.canResolve(meta));
    return relationOptionFold(
      plugin,
      () => indeterminateResolution('SemanticResolutionKernel', `Unsupported kind: ${meta.kind}`, meta.kind, 'unsupported_syntax'),
      candidate => candidate.resolve(meta, context),
    );
  }

  public mapSqlTypeToTs(sqlType: string): string {
    return mapSqlTypeToTs(sqlType);
  }

  public mapCastToTs(castType: string, baseType: string): string {
    return mapCastToTs(castType, baseType);
  }
}

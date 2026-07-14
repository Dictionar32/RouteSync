import { SemanticResolution } from '../types/contract';
import { ResolverPlugin, CycleDetector, SemanticResolutionKernelContract, ResolutionContext, ResolverMeta, ModelNode } from './types';
import { SymbolTable } from './SymbolTable';
import { PrimitiveResolver } from './plugins/PrimitiveResolver';
import { ModelColumnResolver } from './plugins/ModelColumnResolver';
import { AccessorResolver } from './plugins/AccessorResolver';
import { ResourceGraphResolver } from './plugins/ResourceGraphResolver';
import { EloquentMethodResolver } from './plugins/EloquentMethodResolver';
import { ExpressionResolver } from './plugins/ExpressionResolver';
import { FrameworkRegistryResolver } from './plugins/FrameworkRegistryResolver';
import { VariableResolver } from './plugins/VariableResolver';
import { ConditionalWrapperResolver } from './plugins/ConditionalWrapperResolver';

export class SemanticResolutionKernel implements SemanticResolutionKernelContract {
  private plugins: ResolverPlugin[] = [];
  private cycleDetector: CycleDetector;
  private symbolTable: SymbolTable;

  constructor(private models: ModelNode[] = [], private resources: unknown[] = []) {
    this.cycleDetector = new CycleDetector();
    this.symbolTable = new SymbolTable(this.models);
    this.plugins = [
      new PrimitiveResolver(),
      new ModelColumnResolver(),
      new AccessorResolver(),
      new ResourceGraphResolver(),
      new ConditionalWrapperResolver(),
      new FrameworkRegistryResolver(),
      new EloquentMethodResolver(),
      new ExpressionResolver(),
      new VariableResolver(),
      // Model transform fallback
      {
        canResolve: (meta) => meta && meta.kind === 'model',
        resolve: (meta) => {
          const modelVal = meta.kind === 'model' ? meta.model || '' : '';
          return {
            status: 'resolved',
            type: 'model',
            model: modelVal,
            confidence: 100,
            trace: [{ source: 'FallbackResolver', rule: 'Fallback model mapping', input: modelVal, output: `model: ${modelVal}` }]
          };
        }
      }
    ];
  }

  public getModels(): ModelNode[] {
    return this.models;
  }

  public loadGraph(graph: { models?: Record<string, ModelNode> }) {
    if (graph && graph.models) {
      let changed = false;
      for (const [name, node] of Object.entries(graph.models)) {
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

    const context: ResolutionContext = {
      models: this.models,
      resources: this.resources,
      kernel: this,
      cycleDetector: this.cycleDetector,
      symbolTable: this.symbolTable,
      contextModel
    };

    if (contextModel && typeof contextModel === 'object') {
      const obj = contextModel as any;
      if (typeof obj.fileName === 'string') {
        context.fileName = obj.fileName;
      }
      if (obj.assignments) {
        context.assignments = obj.assignments;
      }
      if (obj.resolvedAssignments) {
        context.resolvedAssignments = obj.resolvedAssignments;
      }
    }

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
    const s = sqlType.toLowerCase()
    if (s === 'number' || s === 'boolean' || s === 'string' || s === 'any' || s === 'unknown' || s === 'void') return s
    if (s === 'mixed') return 'unknown'
    if (s.includes('bool') || s.includes('tinyint(1)')) return 'boolean'
    if (s.includes('int') || s.includes('decimal') || s.includes('float') || s.includes('double') || s.includes('numeric')) return 'number'
    return 'string'
  }

  public mapCastToTs(castType: string, baseType: string): string {
    const s = castType.toLowerCase()
    if (s.includes('int') || s.includes('float') || s.includes('double') || s.includes('decimal')) return 'number'
    if (s.includes('bool')) return 'boolean'
    if (s.includes('array') || s.includes('json') || s.includes('object') || s.includes('collection')) return 'json-object'
    if (s.includes('date') || s.includes('datetime')) return 'string'
    return baseType
  }
}

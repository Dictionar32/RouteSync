import { SemanticResolution } from '@routesync/core';
import { ResolverPlugin, CycleDetector, SemanticResolutionKernelContract } from './types';
import { PrimitiveResolver } from './plugins/PrimitiveResolver';
import { ModelColumnResolver } from './plugins/ModelColumnResolver';
import { AccessorResolver } from './plugins/AccessorResolver';
import { ResourceGraphResolver } from './plugins/ResourceGraphResolver';
import { MethodReturnResolver } from './plugins/MethodReturnResolver';
import { ExpressionResolver } from './plugins/ExpressionResolver';
import { FrameworkRegistryResolver } from './plugins/FrameworkRegistryResolver';

export class SemanticResolutionKernel implements SemanticResolutionKernelContract {
  private plugins: ResolverPlugin[] = [];
  private cycleDetector: CycleDetector;

  constructor(private models: any[], private resources: any[] = []) {
    this.cycleDetector = new CycleDetector();
    this.plugins = [
      new PrimitiveResolver(),
      new ModelColumnResolver(),
      new AccessorResolver(),
      new ResourceGraphResolver(),
      new FrameworkRegistryResolver(),
      new MethodReturnResolver(),
      new ExpressionResolver(),
      // Model transform fallback
      {
        canResolve: (meta) => meta && meta.kind === 'model',
        resolve: (meta) => ({
          status: 'resolved',
          type: 'model',
          model: meta.model,
          confidence: 100,
          trace: [{ source: 'FallbackResolver', rule: 'Fallback model mapping', input: meta.model, output: `model: ${meta.model}` }]
        })
      }
    ];
  }

  public getModels(): Record<string, unknown>[] {
    return this.models;
  }

  public resolve(meta: any, contextModel?: any): SemanticResolution {
    if (!meta || meta.kind === 'unknown') {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'SemanticResolutionKernel', rule: 'No metadata available' }]
      };
    }

    const context: any = {
      models: this.models,
      resources: this.resources,
      kernel: this,
      cycleDetector: this.cycleDetector,
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

import { SemanticResolution, TraceNode } from '@routesync/core';
import { ResolverPlugin, ResolutionContext } from '../types';

export class ModelColumnResolver implements ResolverPlugin {
  canResolve(meta: any): boolean {
    return meta && meta.kind === 'model_column';
  }

  resolve(meta: any, context: ResolutionContext): SemanticResolution {
    const model = context.models.find((m: any) => m.name === meta.model);
    if (!model) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'ModelColumnResolver', rule: `Model ${meta.model} not found in manifest` }]
      };
    }

    const col = model.columns?.find((c: any) => c.name === meta.column);
    if (col) {
      let tsType = context.kernel.mapSqlTypeToTs(col.type);
      const trace: TraceNode[] = [{
        source: 'ModelColumnResolver',
        rule: `Column type lookup from database schema`,
        input: `${model.name}.${col.name}`,
        output: tsType
      }];
      
      const castType = (model.casts || {})[col.name];
      if (castType) {
          const oldType = tsType;
          tsType = context.kernel.mapCastToTs(castType, tsType);
          trace.push({
            source: 'ModelColumnResolver',
            rule: `Cast type override`,
            input: `cast: ${castType} (base: ${oldType})`,
            output: tsType
          });
      }
      return {
        status: 'resolved',
        type: tsType,
        nullable: col.nullable || undefined,
        confidence: 100,
        trace
      };
    }

    if (model.accessors && model.accessors[meta.column]) {
      return context.kernel.resolve({ kind: 'model_accessor', model: meta.model, column: meta.column }, model);
    }

    // Accessor fallback: snake_case → camelCase (Laravel accessors are camelCase)
    if (model.accessors) {
      const camelName = meta.column.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
      if (camelName !== meta.column && model.accessors[camelName]) {
        return context.kernel.resolve({ kind: 'model_accessor', model: meta.model, column: camelName }, model);
      }
    }

    if (model.relations && model.relations[meta.column]) {
      const rel = model.relations[meta.column];
      if (rel.model) {
        const isCollection = rel.type?.includes('many') || rel.type?.includes('Many') || false;
        return {
          status: 'resolved',
          type: 'model',
          model: rel.model,
          collection: isCollection || undefined,
          confidence: 100,
          trace: [{
            source: 'ModelColumnResolver',
            rule: `Relation model lookup`,
            input: `${model.name}.${meta.column}`,
            output: `model: ${rel.model} (type: ${rel.type})`
          }]
        };
      }
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'ModelColumnResolver', rule: `Property ${meta.column} not found on model ${model.name}` }]
    };
  }
}

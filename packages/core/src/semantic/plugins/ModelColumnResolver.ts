import { SemanticResolution, TraceNode } from '../../types/contract';
import { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';

export class ModelColumnResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && (meta.kind === 'model_column' || meta.kind === 'model'));
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind === 'model') {
      const modelVal = meta.model || '';
      return {
        status: 'resolved',
        type: 'model',
        model: modelVal,
        confidence: 100,
        trace: [{ source: 'ModelColumnResolver', rule: 'Fallback model mapping', input: modelVal, output: `model: ${modelVal}` }]
      };
    }

    const modelName = meta.model || '';
    const model = context.models.find(m => m.name === modelName);
    if (!model) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'ModelColumnResolver', rule: `Model ${modelName} not found in manifest` }]
      };
    }

    const colName = meta.column || '';
    let colType: string | null = null;
    let isNullable = false;

    if (model.columns && Array.isArray(model.columns)) {
      const col = model.columns.find(c => c.name === colName);
      if (col) {
        colType = col.type;
        isNullable = col.nullable;
      }
    } else if (model.fields && typeof model.fields === 'object') {
      const col = model.fields[colName];
      if (col) {
        colType = col.type;
        isNullable = col.nullable;
      }
    }

    if (colType) {
      let tsType = context.kernel.mapSqlTypeToTs(colType);
      const trace: TraceNode[] = [{
        source: 'ModelColumnResolver',
        rule: `Column type lookup from database schema`,
        input: `${model.name}.${colName}`,
        output: tsType
      }];
      
      const castType = (model.casts || {})[colName];
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
        nullable: isNullable || undefined,
        confidence: 100,
        trace
      };
    }

    // 2. Accessors
    if (model.accessors && model.accessors[colName]) {
      return context.kernel.resolve({ kind: 'model_accessor', model: model.name, column: colName }, model);
    }

    // 3. Relations
    if (model.relations && model.relations[colName]) {
      const rel = model.relations[colName];
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
            input: `${model.name}.${colName}`,
            output: `model: ${rel.model} (type: ${rel.type})`
          }]
        };
      }
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'ModelColumnResolver', rule: `Property ${colName} not found on model ${model.name}` }]
    };
  }
}

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

    if (meta.kind !== 'model_column') {
      return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
    }

    const modelName = meta.model || '';
    const symbol = context.symbolTable.get(modelName);
    if (!symbol) {
      return {
        status: 'unknown',
        type: 'unknown',
        confidence: 0,
        trace: [{ source: 'ModelColumnResolver', rule: `Model ${modelName} not found in manifest` }]
      };
    }

    const colName = meta.column || '';
    const col = symbol.column(colName);
    let colType: string | null = col ? col.type : null;
    let isNullable = col ? col.nullable : false;

    if (colType) {
      let tsType = context.kernel.mapSqlTypeToTs(colType);
      const trace: TraceNode[] = [{
        source: 'ModelColumnResolver',
        rule: `Column type lookup from database schema`,
        input: `${symbol.name}.${colName}`,
        output: tsType
      }];

      const castType = symbol.cast(colName);
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
        trace,
        ...(tsType === 'json-object' ? { sourceModel: symbol.name, sourceColumn: colName } : {})
      };
    }

    // 2. Accessors
    if (symbol.accessor(colName)) {
      return context.kernel.resolve({ kind: 'model_accessor', model: symbol.name, column: colName }, symbol.node);
    }

    // 2b. Accessor fallback: snake_case → camelCase (Laravel accessors are camelCase)
    const camelName = colName.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    if (camelName !== colName && symbol.accessor(camelName)) {
      return context.kernel.resolve({ kind: 'model_accessor', model: symbol.name, column: camelName }, symbol.node);
    }

    // 3. Relations
    const rel = symbol.relation(colName);
    if (rel && rel.model) {
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
          input: `${symbol.name}.${colName}`,
          output: `model: ${rel.model} (type: ${rel.type})`
        }]
      };
    }

    return {
      status: 'unknown',
      type: 'unknown',
      confidence: 0,
      trace: [{ source: 'ModelColumnResolver', rule: `Property ${colName} not found on model ${symbol.name}` }]
    };
  }
}

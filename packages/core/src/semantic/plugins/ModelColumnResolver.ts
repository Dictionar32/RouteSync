import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { ModelSymbol } from '../SymbolTable';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { modelScope } from '../resolutionScope';
import { resolveInScope } from '../kernel/resolveInScope';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { PrimitiveKind, PrimitiveType, type SemanticType } from '../../compiler/types/SemanticType';
import type { ParsedColumn } from '../../types/domain/databaseColumns';

function primitiveFor(type: string): SemanticType {
  switch (type) {
    case 'number': return new PrimitiveType(PrimitiveKind.NUMBER);
    case 'boolean': return new PrimitiveType(PrimitiveKind.BOOLEAN);
    case 'datetime': return new PrimitiveType(PrimitiveKind.DATETIME);
    case 'file': return new PrimitiveType(PrimitiveKind.FILE);
    case 'string': return new PrimitiveType(PrimitiveKind.STRING);
    default: return new PrimitiveType(PrimitiveKind.UNKNOWN);
  }
}

export class ModelColumnResolver implements ResolverPlugin {
  canResolve(meta: ResolverMeta): boolean {
    return !!(meta && meta.kind === 'model_column');
  }

  resolve(meta: ResolverMeta, context: ResolutionContext): SemanticResolution {
    if (meta.kind !== 'model_column') return unknown();

    const symbol = context.symbolTable.get(meta.model.value);
    if (!symbol) return unknown(`Model ${meta.model} not found in manifest`);

    const column = symbol.column(meta.column.value);
    if (column) return this.resolveColumn(symbol, meta.column.value, column, context);

    const accessor = symbol.accessor(meta.column.value);
    if (accessor) return resolveInScope(context.kernel, { kind: 'model_accessor', model: SemanticValueFactory.modelName(symbol.name), column: SemanticValueFactory.columnName(meta.column.value) }, modelScope(symbol.node));

    return unknown(`Property ${meta.column} not found on model ${symbol.name}`);
  }

  private resolveColumn(symbol: ModelSymbol, name: string, column: ParsedColumn, context: ResolutionContext) {
    const tsType = column.semanticType.kind === 'primitive' ? column.semanticType.type : 'unknown';
    const castType = symbol.cast(name);
    const resolvedType = castType ? context.kernel.mapCastToTs(castType.castKind, tsType) : tsType;
    const boundAst = BoundSemanticFactory.modelColumn({
      model: SemanticValueFactory.modelName(symbol.name),
      column: SemanticValueFactory.columnName(name),
      dbType: SemanticValueFactory.databaseTypeName(column.type.kind),
      castType: castType ? { kind: 'cast', type: SemanticValueFactory.castTypeName(castType.castKind) } : { kind: 'no_cast' },
      semanticType: primitiveFor(resolvedType),
    });
    return SemanticResolutionFactory.scalar({
      status: 'resolved', confidence: 100,
      trace: [{ source: 'ModelColumnResolver', rule: 'Column type lookup from database schema', input: `${symbol.name}.${name}`, output: resolvedType }],
      boundAst, semanticType: primitiveFor(resolvedType), nullability: column.nullability,
    });
  }
}

function unknown(message = 'Unknown semantic resolution') {
  return SemanticResolutionFactory.unknown({
    status: 'unknown', confidence: 0,
    trace: [{ source: 'ModelColumnResolver', rule: message, input: '', output: 'unknown' }],
    boundAst: BoundSemanticFactory.unsupported('unresolved_symbol'),
  });
}

import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { ModelSymbol } from '../SymbolTable';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { modelScope } from '../resolutionScope';
import { resolveInScope } from '../kernel/resolveInScope';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { PrimitiveKind, PrimitiveType, type SemanticType } from '../../compiler/types/SemanticType';
import type { ModelColumnFact } from '../../types/upstream/modelSourceFacts';

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

    const columnFact = symbol.columnFact(meta.column.value);
    if (columnFact.kind === 'found') return this.resolveColumn(symbol, meta.column.value, columnFact.value);

    const accessor = symbol.accessor(meta.column.value);
    if (accessor.kind === 'found') {
      return resolveInScope(context.kernel, { kind: 'model_accessor', model: SemanticValueFactory.modelName(symbol.name), column: SemanticValueFactory.columnName(meta.column.value) }, modelScope(symbol.node));
    }

    return unknown(`Property ${meta.column} not found on model ${symbol.name}`);
  }

  private resolveColumn(symbol: ModelSymbol, name: string, fact: ModelColumnFact) {
    const semanticType = fact.type.value.kind === 'primitive' ? fact.type.value.value.kind : 'unknown';
    const castType = fact.type.kind === 'casted' ? { kind: 'cast', type: fact.type.cast.kind } as const : { kind: 'no_cast' } as const;
    const boundAst = BoundSemanticFactory.modelColumn({
      model: SemanticValueFactory.modelName(symbol.name),
      column: SemanticValueFactory.columnName(name),
      dbType: SemanticValueFactory.databaseTypeName(fact.databaseType.kind),
      castType,
      semanticType: primitiveFor(semanticType),
    });
    return SemanticResolutionFactory.scalar({
      status: 'resolved', confidence: 100,
      trace: [{ source: 'ModelColumnResolver', rule: 'Column semantic fact lookup', input: `${symbol.name}.${name}`, output: semanticType }],
      boundAst, semanticType: primitiveFor(semanticType), nullability: fact.nullability,
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

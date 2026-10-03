import type { SemanticResolution } from '../../types/domain/semanticResolution';
import type { ResolverPlugin, ResolutionContext, ResolverMeta } from '../types';
import { BoundSemanticFactory } from '../../types/domain/boundAst';
import { SemanticValueFactory } from '../../types/domain/semanticValues';
import { modelScope } from '../resolutionScope';
import { resolveInScope } from '../kernel/resolveInScope';
import { SemanticResolutionFactory } from '../../types/domain/semanticResolutionFactory';
import { PrimitiveKind, type SemanticType, primitiveType } from '../../compiler/types/SemanticType';
import type { ModelColumnFact } from '../../types/upstream/modelSourceFacts';
import { matchLookup } from '../../types/upstream/collections';
import { relationEqual, relationGate } from '../kernel/semanticRelations';
import { relationFirst, relationOptionFold } from '../kernel/relationalSequence';
import type { ModelSymbol } from '../SymbolTable';

type PrimitiveEntry = readonly [string, PrimitiveKind];
const primitiveEntries: readonly PrimitiveEntry[] = Object.freeze([
  ['number', PrimitiveKind.NUMBER],
  ['boolean', PrimitiveKind.BOOLEAN],
  ['datetime', PrimitiveKind.DATETIME],
  ['file', PrimitiveKind.FILE],
  ['string', PrimitiveKind.STRING],
]);

const primitiveFor = (type: string): SemanticType => {
  const match = relationFirst(primitiveEntries, entry => relationEqual(entry[0], type));
  return relationOptionFold(match, () => primitiveType(PrimitiveKind.INDETERMINATE), entry => primitiveType(entry[1]));
};

const indeterminate = (message: string): SemanticResolution => SemanticResolutionFactory.indeterminate({
  status: 'indeterminate', confidence: 0,
  trace: [{ source: 'ModelColumnResolver', rule: message, input: '', output: 'indeterminate' }],
  boundAst: BoundSemanticFactory.unsupported('unresolved_symbol'),
});

const resolveColumn = (symbol: ModelSymbol, name: string, fact: ModelColumnFact): SemanticResolution => {
  const semanticType = relationGate(
    relationEqual(fact.type.value.kind, 'primitive'),
    () => fact.type.value.value.kind,
    () => 'indeterminate',
  );
  const castType: { readonly kind: 'cast'; readonly type: string } | { readonly kind: 'no_cast' } = relationGate(
    relationEqual(fact.type.kind, 'casted'),
    () => ({ kind: 'cast', type: fact.type.cast.kind }),
    () => ({ kind: 'no_cast' }),
  );
  const semantic = primitiveFor(semanticType);
  const boundAst = BoundSemanticFactory.modelColumn({
    model: SemanticValueFactory.modelName(symbol.name),
    column: SemanticValueFactory.columnName(name),
    dbType: SemanticValueFactory.databaseTypeName(fact.databaseType.kind),
    castType,
    semanticType: semantic,
  });
  return SemanticResolutionFactory.scalar({
    status: 'resolved', confidence: 100,
    trace: [{ source: 'ModelColumnResolver', rule: 'Column semantic fact lookup', input: `${symbol.name}.${name}`, output: semanticType }],
    boundAst, semanticType: semantic, nullability: fact.nullability,
  });
};

const resolveSymbolColumn = (symbol: ModelSymbol, meta: Extract<ResolverMeta, { kind: 'model_column' }>, context: ResolutionContext): SemanticResolution =>
  matchLookup(symbol.columnFact(meta.column.value), {
    found: ({ value }) => resolveColumn(symbol, meta.column.value, value),
    missing: () => matchLookup(symbol.accessor(meta.column.value), {
      found: () => resolveInScope(
        context.kernel,
        { kind: 'model_accessor', model: SemanticValueFactory.modelName(symbol.name), column: SemanticValueFactory.columnName(meta.column.value) },
        modelScope(symbol.node),
      ),
      missing: () => indeterminate(`Property ${meta.column} not found on model ${symbol.name}`),
    }),
  });

export const ModelColumnResolver: ResolverPlugin = Object.freeze({
  canResolve: (meta: ResolverMeta): boolean => relationEqual(meta.kind, 'model_column'),
  resolve: (meta: ResolverMeta, context: ResolutionContext): SemanticResolution => relationGate(
    relationEqual(meta.kind, 'model_column'),
    () => matchLookup(context.symbolTable.lookup(meta.model.value), {
      missing: () => indeterminate(`Model ${meta.model} not found in manifest`),
      found: lookup => resolveSymbolColumn(lookup.value, meta, context),
    }),
    () => indeterminate('Unsupported model-column metadata'),
  ),
});

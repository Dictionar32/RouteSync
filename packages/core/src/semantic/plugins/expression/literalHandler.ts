import type { SemanticResolution } from '../../../types/domain/semanticResolution';
import { SemanticResolutionFactory } from '../../../types/domain/semanticResolutionFactory';
import { BoundSemanticFactory } from '../../../types/domain/boundAst';
import { PrimitiveKind, type PrimitiveType, primitiveType } from '../../../types/domain/semanticType';
import type { BoundLiteralValue } from '../../../types/domain/semanticValues';
import type { ResolverMeta } from '../../types';
import { relationFirstOption, relationOptionFold, relationResolve, relationRefine } from '../../kernel/relationalSequence';
import { semanticNullAtom } from '../../kernel/semanticNullAtom';
import { relationEqual } from '../../kernel/semanticRelations';

type LiteralMeta = Extract<ResolverMeta, { kind: 'literal' }>;
const literalTypeCatalog: readonly [BoundLiteralValue['kind'], PrimitiveType][] = Object.freeze([
  ['number', primitiveType(PrimitiveKind.NUMBER)],
  ['boolean', primitiveType(PrimitiveKind.BOOLEAN)],
  ['string', primitiveType(PrimitiveKind.STRING)],
  ['null', primitiveType(PrimitiveKind.INDETERMINATE)],
]);

const isLiteralMeta = (meta: ResolverMeta): meta is LiteralMeta => relationEqual(meta.kind, 'literal');

export function resolveLiteral(meta: ResolverMeta): SemanticResolution {
  return relationOptionFold(
    relationRefine({ kind: meta.kind, value: meta }, isLiteralMeta),
    () => SemanticResolutionFactory.indeterminate({
      status: 'indeterminate', confidence: 0, trace: [{
        source: 'ExpressionResolver', rule: 'Invalid literal metadata', input: meta.kind, output: 'indeterminate',
      }], boundAst: BoundSemanticFactory.unsupported('invalid_boundary_input'),
    }),
    entry => {
      const value = literalValue(entry.value.value);
      return relationOptionFold(
        relationFirstOption(literalTypeCatalog, entry => relationEqual(entry[0], value.kind)),
        () => SemanticResolutionFactory.indeterminate({
          status: 'indeterminate', confidence: 0, trace: [{
            source: 'ExpressionResolver', rule: 'Unknown literal kind', input: value.kind, output: 'indeterminate',
          }], boundAst: BoundSemanticFactory.unsupported('invalid_boundary_input'),
        }),
        entry => SemanticResolutionFactory.scalar({
          status: 'resolved', confidence: 100, nullable: relationEqual(value.kind, 'null'), semanticType: entry[1],
          trace: [{
            source: 'ExpressionResolver', rule: 'Literal type mapping',
            input: value.kind, output: entry[1].type,
          }],
          boundAst: BoundSemanticFactory.primitive(entry[1], value),
        }),
      );
    },
  );
}

type LiteralInput = Extract<ResolverMeta, { kind: 'literal' }>['value'];

function literalValue(value: LiteralInput): BoundLiteralValue {
  return relationResolve(Object.is(typeof value, 'number'),
    () => ({ kind: 'number', value } satisfies BoundLiteralValue),
    () => relationResolve(Object.is(typeof value, 'boolean'),
      () => ({ kind: 'boolean', value } satisfies BoundLiteralValue),
      () => relationResolve(Object.is(typeof value, 'string'),
        () => ({ kind: 'string', value } satisfies BoundLiteralValue),
        () => semanticNullAtom() satisfies BoundLiteralValue)),
  );
}

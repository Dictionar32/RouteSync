import type { SemanticResolution } from '../../../../types/domain/semanticResolution';
import type { ResolverMeta } from '../../../types';
import { BoundSemanticFactory } from '../../../../types/domain/boundAst';
import { SemanticResolutionFactory } from '../../../../types/domain/semanticResolutionFactory';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import { PrimitiveKind, PrimitiveType } from '../../../../compiler/types/SemanticType';

export function tryResolveSpecialPropertyAccess(
  prop: string,
  meta: ResolverMeta,
  targetRes: SemanticResolution,
): SemanticResolution | null {
  if (targetRes.kind === 'object' || targetRes.kind === 'query_projection') {
    const field = targetRes.surface.byName.get(SemanticValueFactory.responseFieldName(prop));
    if (field === undefined) return null;
    const name = field.name;
    const semanticType = field.type;
    const boundAst = targetRes.kind === 'query_projection'
      ? BoundSemanticFactory.projectionField({ sourceModel: targetRes.sourceModel, field: name, semanticType })
      : targetRes.boundAst;
    return SemanticResolutionFactory.scalar({
      status: 'resolved', confidence: targetRes.confidence,
      trace: [...targetRes.trace, {
        source: 'SpecialAccessResolver', rule: 'Structured field lookup',
        input: prop, output: semanticType.kind,
      }],
      boundAst,
      semanticType,
      nullability: meta.kind === 'nullsafe_property_access'
        ? { kind: 'nullable' }
        : { kind: 'non_nullable' },
    });
  }

  if (targetRes.kind === 'scalar' && prop === 'plainTextToken') {
    const tokenType = new PrimitiveType(PrimitiveKind.STRING);
    return SemanticResolutionFactory.scalar({
      status: 'resolved', confidence: targetRes.confidence,
      trace: [...targetRes.trace, {
        source: 'SpecialAccessResolver', rule: 'Token text property',
        input: prop, output: PrimitiveKind.STRING,
      }],
      boundAst: targetRes.boundAst,
      semanticType: tokenType,
      nullability: { kind: 'non_nullable' },
    });
  }

  return null;
}

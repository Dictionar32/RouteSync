/** Projects the canonical SemanticType ADT without semantic reclassification. */
import type { TypeIR } from '../../../types/ir';
import type { SemanticType } from '../../../compiler/types/SemanticType';
import { SemanticTypeResolvers } from '../SemanticTypeResolvers';

export function convertSemanticToTypeIR(semanticType: SemanticType): TypeIR {
  return semanticType.accept({
    primitive: value => SemanticTypeResolvers.primitive(value),
    jsonValue: value => SemanticTypeResolvers.jsonValue(value),
    optional: value => SemanticTypeResolvers.optional(value, convertSemanticToTypeIR),
    nullable: value => SemanticTypeResolvers.nullable(value, convertSemanticToTypeIR),
    never: value => SemanticTypeResolvers.never(value),
    error: value => SemanticTypeResolvers.error(value),
    reference: value => SemanticTypeResolvers.reference(value),
    union: value => SemanticTypeResolvers.union(value, convertSemanticToTypeIR),
    intersection: value => SemanticTypeResolvers.intersection(value, convertSemanticToTypeIR),
    readonlyCollection: value => SemanticTypeResolvers.readonlyCollection(value, convertSemanticToTypeIR),
    mutableCollection: value => SemanticTypeResolvers.mutableCollection(value, convertSemanticToTypeIR),
    generic: value => SemanticTypeResolvers.generic(value, convertSemanticToTypeIR),
    object: value => SemanticTypeResolvers.object(value, convertSemanticToTypeIR),
  });
}

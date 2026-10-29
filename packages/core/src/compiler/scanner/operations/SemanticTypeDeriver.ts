/** Compatibility facade. Semantic inference lives in compiler/semantic/type-derivation and is owned by the upstream authority contract. */
import type { ObjectType } from '../../../types/domain/semanticType';
import type { SemanticTypeDerivationJudgment } from '../../../types/upstream/semanticTypeDerivationInterface';
import type { RouteSemanticFlow } from '../../../types/route';
import type { ModelAst, ResourceAst } from '../../../types/upstream/ast';
import { TypeInterner } from '../../types/TypeInterner';
import { SemanticDerivationContext } from '../../semantic/type-derivation/SemanticDerivationContext';
import { semanticTypeDerivationAuthority } from '../../semantic/type-derivation/semanticTypeDerivationAuthority';

export interface SemanticTypeDeriver {
  readonly context: SemanticDerivationContext;
  readonly judgment: SemanticTypeDerivationJudgment;
}

const fromContext = (context: SemanticDerivationContext): SemanticTypeDeriver => Object.freeze({
  context,
  judgment: semanticTypeDerivationAuthority.resolve({
    resources: context.resources,
    models: context.models,
    routes: context.routes,
    interner: context.interner,
  }),
});

export const SemanticTypeDeriver = Object.freeze({
  create: fromContext,
  fromContext: (
    resources: readonly ResourceAst[] = [],
    models: readonly ModelAst[] = [],
    interner: TypeInterner = TypeInterner.create(),
    routes: readonly RouteSemanticFlow[] = [],
  ): SemanticTypeDeriver => fromContext(SemanticDerivationContext.create(resources, models, interner, routes)),
  derive: (
    resources: readonly ResourceAst[] = [],
    models: readonly ModelAst[] = [],
    interner: TypeInterner = TypeInterner.create(),
    routes: readonly RouteSemanticFlow[] = [],
  ): readonly ObjectType[] => fromContext(SemanticDerivationContext.create(resources, models, interner, routes)).judgment.result,
});

export {
  SemanticDerivationContext,
  deriveResourceTypes,
  deriveRouteResponseTypes,
  deriveModelTypes,
} from '../../semantic/type-derivation/index';

/** Relational semantic type derivation facade. */
import type { ObjectType } from '../../types/SemanticType';
import type { RouteSemanticFlow } from '../../../types/route';
import type { ModelAst, ResourceAst } from '../../../types/upstream/ast';
import { TypeInterner } from '../../types/TypeInterner';
import { relationUnique } from '../../../semantic/foundation/relationMembership';
import type { RelationMembership } from '../../../semantic/foundation/relationMembership';
import { SemanticDerivationContext } from './semantic/SemanticDerivationContext';
import { deriveResourceTypes } from './semantic/resourceTypeDeriver';
import { deriveRouteResponseTypes } from './semantic/routeResponseDeriver';
import { deriveModelTypes } from './semantic/modelTypeDeriver';

export interface SemanticTypeDeriver {
  readonly context: SemanticDerivationContext;
  readonly run: () => readonly ObjectType[];
}

const fromContext = (context: SemanticDerivationContext): SemanticTypeDeriver => {
  const run = (): readonly ObjectType[] => {
    const seenNames: RelationMembership<string> = relationUnique([]);
    const resourceTypes = deriveResourceTypes(context, seenNames);
    const routeTypes = deriveRouteResponseTypes(context, seenNames);
    const modelTypes = deriveModelTypes(context, seenNames);
    return Object.freeze([...resourceTypes, ...routeTypes, ...modelTypes]);
  };
  return Object.freeze({ context, run });
};

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
  ): readonly ObjectType[] => fromContext(SemanticDerivationContext.create(resources, models, interner, routes)).run(),
});

export {
  SemanticDerivationContext,
  deriveResourceTypes,
  deriveRouteResponseTypes,
  deriveModelTypes,
};

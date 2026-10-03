/** Immutable relational context for semantic type derivation. */
import type { RouteSemanticFlow } from '../../../../types/route';
import { TypeInterner } from '../../../types/TypeInterner';
import type { ModelAst, ResourceAst } from '../../../../types/upstream/ast';
import { relationFold } from '../../../../semantic/kernel/relationalSequence';
import type { RelationIndex } from '../../../../semantic/kernel/relationMembership';
import { relationIndexAdd } from '../../../../semantic/kernel/relationMembership';

export interface SemanticDerivationContext {
  readonly resources: readonly ResourceAst[];
  readonly models: readonly ModelAst[];
  readonly interner: TypeInterner;
  readonly routes: readonly RouteSemanticFlow[];
  readonly modelsByName: RelationIndex<string, ModelAst>;
}

const normalizeSequence = <T>(value: readonly T[]): readonly T[] => Object.freeze([...value]);

export const SemanticDerivationContext = Object.freeze({
  create: (
    resources: readonly ResourceAst[] = [],
    models: readonly ModelAst[] = [],
    interner: TypeInterner = TypeInterner.create(),
    routes: readonly RouteSemanticFlow[] = [],
  ): SemanticDerivationContext => {
    const safeResources = normalizeSequence(resources);
    const safeModels = normalizeSequence(models);
    const safeRoutes = normalizeSequence(routes);
    const modelsByName = relationFold(
      safeModels,
      Object.freeze([] as RelationIndex<string, ModelAst>),
      (index, model) => relationIndexAdd(
        relationIndexAdd(index, model.definition.identity.name.value.value, model),
        model.definition.identity.name.value.value.toLowerCase(),
        model,
      ),
    );
    return Object.freeze({ resources: safeResources, models: safeModels, interner, routes: safeRoutes, modelsByName });
  },
  empty: (): SemanticDerivationContext => SemanticDerivationContext.create([], [], TypeInterner.create(), []),
});

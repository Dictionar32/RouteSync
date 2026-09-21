/**
 * SemanticDerivationContext.ts
 *
 * Origin Boundary Context ensuring guaranteed, non-nullable inputs for semantic type derivation.
 *
 * @module core/compiler/scanner/subscanners/semantic
 */

import type {
    ParsedRoute,
    ParsedResource,
    ParsedModel
} from '../../../../types/route';
import { TypeInterner } from '../../../types/TypeInterner';
import type { ModelAst } from '../../../../types/upstream/ast';

/**
 * Origin Boundary Context ensuring guaranteed, non-nullable inputs.
 */
export class SemanticDerivationContext {
    public readonly resources: readonly ParsedResource[];
    public readonly models: readonly ModelAst[];
    public readonly interner: TypeInterner;
    public readonly routes: readonly ParsedRoute[];
    public readonly modelsByName: ReadonlyMap<string, ModelAst>;

    public constructor(params: {
        readonly resources: readonly ParsedResource[];
        readonly models: readonly ModelAst[];
        readonly interner: TypeInterner;
        readonly routes: readonly ParsedRoute[];
        readonly modelsByName: ReadonlyMap<string, ModelAst>;
    }) {
        this.resources = params.resources;
        this.models = params.models;
        this.interner = params.interner;
        this.routes = params.routes;
        this.modelsByName = params.modelsByName;
        Object.freeze(this);
    }

    public static create(
        resources?: readonly ParsedResource[],
        models?: readonly ModelAst[],
        interner?: TypeInterner,
        routes?: readonly ParsedRoute[]
    ): SemanticDerivationContext {
        const safeResources: readonly ParsedResource[] = resources ? Array.from(resources) : [];
        const safeModels: readonly ModelAst[] = models ? Array.from(models) : [];
        const safeInterner: TypeInterner = interner ? interner : new TypeInterner();
        const safeRoutes: readonly ParsedRoute[] = routes ? Array.from(routes) : [];

        const modelsByName = new Map<string, ModelAst>();
        for (const m of safeModels) {
            if (m.definition.identity.name) {
                modelsByName.set(m.definition.identity.name.value.value, m);
                modelsByName.set(m.definition.identity.name.value.value.toLowerCase(), m);
            }
        }

        return new SemanticDerivationContext({
            resources: Object.freeze(safeResources),
            models: Object.freeze(safeModels),
            interner: safeInterner,
            routes: Object.freeze(safeRoutes),
            modelsByName
        });
    }

    public static empty(): SemanticDerivationContext {
        return SemanticDerivationContext.create([], [], new TypeInterner(), []);
    }
}

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

/**
 * Origin Boundary Context ensuring guaranteed, non-nullable inputs.
 */
export class SemanticDerivationContext {
    public readonly resources: readonly ParsedResource[];
    public readonly models: readonly ParsedModel[];
    public readonly interner: TypeInterner;
    public readonly routes: readonly ParsedRoute[];
    public readonly modelsByName: ReadonlyMap<string, ParsedModel>;

    public constructor(params: {
        readonly resources: readonly ParsedResource[];
        readonly models: readonly ParsedModel[];
        readonly interner: TypeInterner;
        readonly routes: readonly ParsedRoute[];
        readonly modelsByName: ReadonlyMap<string, ParsedModel>;
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
        models?: readonly ParsedModel[],
        interner?: TypeInterner,
        routes?: readonly ParsedRoute[]
    ): SemanticDerivationContext {
        const safeResources: readonly ParsedResource[] = resources ? Array.from(resources) : [];
        const safeModels: readonly ParsedModel[] = models ? Array.from(models) : [];
        const safeInterner: TypeInterner = interner ? interner : new TypeInterner();
        const safeRoutes: readonly ParsedRoute[] = routes ? Array.from(routes) : [];

        const modelsByName = new Map<string, ParsedModel>();
        for (const m of safeModels) {
            if (m && m.name) {
                modelsByName.set(m.name, m);
                modelsByName.set(m.name.toLowerCase(), m);
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

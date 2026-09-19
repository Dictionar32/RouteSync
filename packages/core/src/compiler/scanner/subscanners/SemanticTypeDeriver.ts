/**
 * SemanticTypeDeriver.ts
 *
 * Active Consumer & Orchestrator: Derives Canonical ObjectType[] AST streams.
 * Consumes modular sub-domains from semantic/ with zero wildcard re-exports.
 *
 * @module core/compiler/scanner/subscanners
 */

import type {
    ParsedRoute,
    ParsedResource,
    ParsedModel
} from '../../../types/route';
import type { ObjectType } from '../../types/SemanticType';
import { TypeInterner } from '../../types/TypeInterner';

// Sub-domain imports
import { SemanticDerivationContext } from './semantic/SemanticDerivationContext';

import { deriveResourceTypes } from './semantic/resourceTypeDeriver';
import { deriveRouteResponseTypes } from './semantic/routeResponseDeriver';
import { deriveModelTypes } from './semantic/modelTypeDeriver';

// ─── Active Consumer Orchestrator: Pure Flow ──────────────────────────────────

export class SemanticTypeDeriver {
    public readonly context: SemanticDerivationContext;

    public constructor(context: SemanticDerivationContext) {
        this.context = context;
        Object.freeze(this);
    }

    public static create(context: SemanticDerivationContext): SemanticTypeDeriver {
        return new SemanticTypeDeriver(context);
    }

    public static fromContext(
        resources: readonly ParsedResource[] = [],
        models: readonly ParsedModel[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): SemanticTypeDeriver {
        return new SemanticTypeDeriver(SemanticDerivationContext.create(resources, models, interner, routes));
    }

    /**
     * Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
     */
    public static derive(
        resources: readonly ParsedResource[] = [],
        models: readonly ParsedModel[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        const deriver = SemanticTypeDeriver.fromContext(resources, models, interner, routes);
        return deriver.run();
    }

    /**
     * Pure Flow Declaration: Resources -> Route Responses -> Models -> Unified ObjectType Stream
     */
    public run(): readonly ObjectType[] {
        const seenNames = new Set<string>();
        const resourceTypes = deriveResourceTypes(this.context, seenNames);
        const routeTypes = deriveRouteResponseTypes(this.context, seenNames);
        const modelTypes = deriveModelTypes(this.context, seenNames);

        return Object.freeze([...resourceTypes, ...routeTypes, ...modelTypes]);
    }
}

// ─── Explicit Named Exports (Rule 14: Zero Wildcard Re-export) ────────────────

export {
    SemanticDerivationContext,
    deriveResourceTypes,
    deriveRouteResponseTypes,
    deriveModelTypes
};


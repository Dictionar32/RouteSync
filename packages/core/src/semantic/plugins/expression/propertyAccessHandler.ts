/**
 * propertyAccessHandler.ts
 *
 * Resolves property_access and nullsafe_property_access on targets, JSON members, and models.
 * Active Consumer: Orchestrates property access resolution.
 *
 * @module semantic/plugins/expression/propertyAccessHandler
 */

export {
    resolvePropertyAccess,
    tryResolveSpecialPropertyAccess,
    resolveTargetModelForPropertyAccess
} from './property-access/index';

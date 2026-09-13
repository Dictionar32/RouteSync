/**
 * modelDescriptors.ts
 *
 * Active Consumer Orchestrator: AST descriptors for Eloquent Models,
 * Columns, Casts, Accessors, and Relations.
 *
 * Follows Rule 14: 0 wildcard re-exports (`0 export * from`), active consumption,
 * and pure unifying factory entry points.
 *
 * @module core/compiler/scanner/descriptors/modelDescriptors
 */

import {
    ScannedModelCastParams,
    ScannedModelCastDescriptor
} from "./model/modelCastDescriptor";

import {
    ScannedModelRelationParams,
    ScannedModelRelationDescriptor
} from "./model/modelRelationDescriptor";

import {
    ScannedModelColumnParams,
    ScannedModelColumnDescriptor
} from "./model/modelColumnDescriptor";

import {
    ScannedModelAccessorParams,
    ScannedModelAccessorDescriptor
} from "./model/modelAccessorDescriptor";

import {
    ScannedModelParams,
    ScannedModelDescriptor
} from "./model/modelEntityDescriptor";

// ============================================================================
// Active Consumer: Composite Factory & Unifying Entry Points
// ============================================================================

/**
 * Pure Factory: Constructs a complete ScannedModelDescriptor.
 */
export function createScannedModel(
    params: Parameters<typeof ScannedModelDescriptor.create>[0]
): ScannedModelDescriptor {
    return ScannedModelDescriptor.create(params);
}

/**
 * Pure Factory: Constructs a ScannedModelColumnDescriptor.
 */
export function createScannedColumn(
    params: Parameters<typeof ScannedModelColumnDescriptor.create>[0]
): ScannedModelColumnDescriptor {
    return ScannedModelColumnDescriptor.create(params);
}

/**
 * Pure Factory: Constructs a ScannedModelCastDescriptor.
 */
export function createScannedCast(
    params: Parameters<typeof ScannedModelCastDescriptor.create>[0]
): ScannedModelCastDescriptor {
    return ScannedModelCastDescriptor.create(params);
}

/**
 * Pure Factory: Constructs a ScannedModelRelationDescriptor.
 */
export function createScannedRelation(
    params: Parameters<typeof ScannedModelRelationDescriptor.create>[0]
): ScannedModelRelationDescriptor {
    return ScannedModelRelationDescriptor.create(params);
}

/**
 * Pure Factory: Constructs a ScannedModelAccessorDescriptor.
 */
export function createScannedAccessor(
    params: Parameters<typeof ScannedModelAccessorDescriptor.create>[0]
): ScannedModelAccessorDescriptor {
    return ScannedModelAccessorDescriptor.create(params);
}

// ============================================================================
// Explicit Named Exports (Rule 14: Zero Wildcard Re-export)
// ============================================================================

export {
    ScannedModelCastParams,
    ScannedModelCastDescriptor,
    ScannedModelRelationParams,
    ScannedModelRelationDescriptor,
    ScannedModelColumnParams,
    ScannedModelColumnDescriptor,
    ScannedModelAccessorParams,
    ScannedModelAccessorDescriptor,
    ScannedModelParams,
    ScannedModelDescriptor
};

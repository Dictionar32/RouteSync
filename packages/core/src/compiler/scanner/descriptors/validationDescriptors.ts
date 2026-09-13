/**
 * validationDescriptors.ts
 *
 * Active Consumer Orchestrator for Route validation rules, payloads, and tree building.
 * Exposes complete contract descriptors and pure functional validation tree builders.
 *
 * @module core/compiler/scanner/descriptors/validationDescriptors
 */

import { RouteValidationRuleEntry, ValidationFieldNode } from "../../../types/route";
import {
    ScannedRouteValidationRuleEntry,
    ScannedRouteValidationRuleParams,
    ScannedRouteSchemaPayload,
    ScannedRouteSchemaParams,
    ScannedScalarFieldNode,
    ScannedScalarFieldParams,
    ScannedObjectFieldNode,
    ScannedObjectFieldParams,
    ScannedArrayFieldNode,
    ScannedArrayFieldParams,
    ValidationTreeBuilder
} from "./validation";

export {
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams,
    ScannedRouteSchemaPayload,
    type ScannedRouteSchemaParams,
    ScannedScalarFieldNode,
    type ScannedScalarFieldParams,
    ScannedObjectFieldNode,
    type ScannedObjectFieldParams,
    ScannedArrayFieldNode,
    type ScannedArrayFieldParams,
    ValidationTreeBuilder
};

/**
 * Functional entry point for building validation AST trees.
 */
export function buildValidationTree(rules: readonly RouteValidationRuleEntry[]): readonly ValidationFieldNode[] {
    return ValidationTreeBuilder.buildTree(rules);
}

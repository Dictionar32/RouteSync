/**
 * validationDescriptors.ts
 *
 * Active Consumer Orchestrator for Route validation rules, payloads, and tree building.
 * Exposes complete contract descriptors and pure functional validation tree builders.
 *
 * @module core/compiler/scanner/descriptors/validationDescriptors
 */

import type { ValidationFieldNode } from "../../../types/route";
import {
    RouteSemanticFlowValidationRuleSet,
    type RouteValidationRuleSet
} from "./validation/validationRuleSet";
import {
    ScannedRouteValidationRuleEntry,
    ScannedRouteValidationRuleParams,
    ValidationTreeBuilder
} from "./validation";

export {
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams,
    ValidationTreeBuilder,
    RouteSemanticFlowValidationRuleSet,
    type RouteValidationRuleSet
};

/**
 * Functional entry point for building validation AST trees.
 */
export function buildValidationTree(ruleSet: RouteValidationRuleSet): readonly ValidationFieldNode[] {
    return ValidationTreeBuilder.buildTree(ruleSet);
}

/**
 * validationDescriptors.ts
 *
 * Active Consumer Orchestrator for Route validation rules, payloads, and tree building.
 * Exposes complete contract descriptors and pure functional validation tree builders.
 *
 * @module core/compiler/scanner/operations/domain-model/validationDescriptors
 */

import type { ValidationFieldNode } from "../../../../types/route";
import {
    RouteSemanticFlowValidationRuleSet,
    type RouteValidationRuleSet
} from "../../../semantic/validation/validationRuleSet";
import {
    ScannedRouteValidationRuleEntry,
    type ScannedRouteValidationRuleParams,
    ValidationTreeBuilder
} from "../../../semantic/validation";

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
export interface BuildValidationTreeOperation {
  (ruleSet: RouteValidationRuleSet): readonly ValidationFieldNode[];
}

export const buildValidationTree: BuildValidationTreeOperation = Object.freeze((ruleSet: RouteValidationRuleSet): readonly ValidationFieldNode[] => {
    return ValidationTreeBuilder.buildTree(ruleSet);
});

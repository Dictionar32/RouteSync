/**
 * Projects the already-resolved validation tree from the scanner model.
 * No validation classification or shape reconstruction happens here.
 */
import type { ValidationFieldNode } from '../../../../types/route';
import type { RouteValidationRuleSet } from './validationRuleSet';

export class ValidationTreeBuilder {
    public static buildTree(ruleSet: RouteValidationRuleSet): readonly ValidationFieldNode[] {
        return ruleSet.tree;
    }
}

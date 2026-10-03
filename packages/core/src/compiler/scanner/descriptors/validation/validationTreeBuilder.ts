/** Projects the canonical validation relation tree without reconstruction. */
import type { ValidationFieldNode } from '../../../../types/route';
import type { RouteValidationRuleSet } from './validationRuleSet';

export const ValidationTreeBuilder = Object.freeze({
    buildTree: (ruleSet: RouteValidationRuleSet): readonly ValidationFieldNode[] => ruleSet.tree
});

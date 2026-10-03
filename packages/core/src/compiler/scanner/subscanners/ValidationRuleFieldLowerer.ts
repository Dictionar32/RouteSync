/**
 * Pure adapter for the scanner-boundary validation model.
 * Semantic grouping is owned by RouteSemanticFlowValidationRuleSet.
 */
import type { RouteSemanticFlow, RouteValidationRuleEntry } from "../../../types/route";
import type { RequestField } from "../../../types/domain/request";
import { TypeInterner } from "../../types/TypeInterner";
import { RouteSemanticFlowValidationRuleSet } from "../descriptors/validation/validationRuleSet";

export class ValidationRuleFieldLowerer {
    public static lower(route: RouteSemanticFlow): RequestField[] {
        return [...route.binding.schema.fields];
    }

    public static lowerEntries(
        entries: readonly RouteValidationRuleEntry[],
        interner: TypeInterner = TypeInterner.create()
    ): RequestField[] {
        return [...RouteSemanticFlowValidationRuleSet.create(entries, interner).fields];
    }
}

/**
 * Pure adapter for the scanner-boundary validation model.
 * Semantic grouping is owned by ScannedRouteValidationRuleSet.
 */
import type { ParsedRoute, RouteValidationRuleEntry } from "../../../types/route";
import type { RequestField } from "../../../types/domain/request";
import { TypeInterner } from "../../types/TypeInterner";
import { ScannedRouteValidationRuleSet } from "../descriptors/validation/validationRuleSet";

export class ValidationRuleFieldLowerer {
    public static lower(route: ParsedRoute): RequestField[] {
        return [...route.binding.schema.fields];
    }

    public static lowerEntries(
        entries: readonly RouteValidationRuleEntry[],
        interner: TypeInterner = new TypeInterner()
    ): RequestField[] {
        return [...ScannedRouteValidationRuleSet.create(entries, interner).fields];
    }
}

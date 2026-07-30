/**
 * Resource Naming Utility
 *
 * Single source of truth for deriving a resource's "base name" (the name
 * used for its `${base}Transformed` interface and `${base}Show`/`${base}Index`
 * aliases).
 *
 * PROBLEM THIS SOLVES:
 * ContractIRBuilder.buildResourceAliases() and ReadEmitter.generateResourceInterface()
 * used to compute this independently — one stripped the "Resource" suffix,
 * the other didn't — so the interface (`CategoryResourceTransformed`) and its
 * alias target (`CategoryTransformed`) pointed at two different, non-existent
 * symbols. Both call sites must import this function instead of deriving the
 * name locally.
 */
export function resourceBaseName(resourceName: string): string {
    return resourceName.replace(/Resource$/, '')
}

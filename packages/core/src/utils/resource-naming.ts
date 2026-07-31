/**
 * Resource Naming Utility
 *
 * Single source of truth for deriving a resource's "base name" (the name
 * used for its `${base}Transformed` interface and `${base}Show`/`${base}Index`
 * aliases).
 *
 * NOTE: this used to strip a trailing "Resource" (so `OrderResource` ->
 * `Order`), on the theory that the suffix was just Laravel/JsonResource
 * naming noise. That was wrong: a hand-authored `OrderResource` (API
 * response shape — computed/nested fields, camelCased) and the plain
 * `Order` model (raw DB columns) are genuinely different types and both
 * need to reach the emitted output. Stripping the suffix collapsed them
 * into one name and caused one to silently overwrite/collide with the
 * other. Both call sites (ContractIRBuilder.buildResourceAliases and
 * ReadEmitter.generateResourceInterface) must still import this function
 * rather than deriving the name locally, so if naming rules change again
 * later they change in exactly one place.
 */
export function resourceBaseName(resourceName: string): string {
    return resourceName
}

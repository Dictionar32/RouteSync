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

/**
 * Convert snake_case string to camelCase
 * Used for property name conversions from database columns
 * 
 * @param str - Snake case string (e.g., 'user_id', 'total_harga')
 * @returns Camel case string (e.g., 'userId', 'totalHarga')
 * 
 * @example
 * ```typescript
 * toCamelCase('user_id')      // 'userId'
 * toCamelCase('created_at')   // 'createdAt'
 * toCamelCase('total_harga')  // 'totalHarga'
 * ```
 */
export function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/**
 * Capitalize first letter of string
 * Used for building nested property paths
 * 
 * @param str - Input string (e.g., 'address', 'name')
 * @returns String with first letter capitalized (e.g., 'Address', 'Name')
 * 
 * @example
 * ```typescript
 * capitalize('address')  // 'Address'
 * capitalize('name')     // 'Name'
 * capitalize('')         // ''
 * ```
 */
export function capitalize(str: string): string {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert string to PascalCase
 * Used for generating type names from resource paths
 * 
 * @param str - Input string (e.g., 'cart-items', 'user_profile')
 * @returns PascalCase string (e.g., 'CartItems', 'UserProfile')
 * 
 * @example
 * ```typescript
 * toPascalCase('cart-items')    // 'CartItems'
 * toPascalCase('user_profile')  // 'UserProfile'
 * toPascalCase('products')      // 'Products'
 * ```
 */
export function toPascalCase(str: string): string {
    // Handle snake_case and kebab-case
    return str
        .split(/[-_\s]+/)
        .map(word => capitalize(word))
        .join('')
}

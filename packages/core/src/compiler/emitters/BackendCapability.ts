/**
 * @file BackendCapability.ts
 * @description Capability flags untuk different backend targets
 */

/**
 * Describes capability features yang disupport oleh specific backend target
 * 
 * Used untuk conditional code generation based on target language features
 * 
 * @example
 * ```typescript
 * const tsCapability: BackendCapability = {
 *   supportsGenerics: true,
 *   supportsNullable: true,
 *   supportsReadonly: true
 * };
 * 
 * const jsCapability: BackendCapability = {
 *   supportsGenerics: false,
 *   supportsNullable: false,
 *   supportsReadonly: false
 * };
 * ```
 */
export interface BackendCapability {
    /** Whether backend supports generic types (e.g., TypeScript, Java, C#) */
    readonly supportsGenerics: boolean;

    /** Whether backend supports nullable types explicitly (e.g., TypeScript, Kotlin) */
    readonly supportsNullable: boolean;

    /** Whether backend supports readonly/immutable markers (e.g., TypeScript, Rust) */
    readonly supportsReadonly: boolean;
}

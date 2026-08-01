/**
 * Fingerprint.ts
 * 
 * Compiler fingerprinting for cache invalidation.
 */

import { createHash } from 'crypto';

/**
 * Compiler fingerprint.
 * 
 * Captures all compiler settings and versions that affect compilation output.
 * Used for cache invalidation and build reproducibility.
 */
export interface CompilerFingerprint {
    /**
     * Compiler version (e.g., '6.1.0').
     */
    readonly compilerVersion: string;

    /**
     * Parser version (e.g., '1.0.0').
     */
    readonly parserVersion: string;

    /**
     * PHP version (e.g., '8.2.0').
     */
    readonly phpVersion: string;

    /**
     * Framework version (e.g., '10.0.0' for Laravel 10).
     */
    readonly frameworkVersion: string;

    /**
     * Target backend (e.g., 'typescript', 'javascript').
     */
    readonly targetBackend: string;

    /**
     * Whether strict mode is enabled.
     */
    readonly strictMode: boolean;

    /**
     * Feature flags affecting compilation.
     */
    readonly featureFlags: ReadonlyMap<string, boolean>;
}

/**
 * Compute stable hash of compiler fingerprint.
 * 
 * The hash is computed from a canonical JSON representation with:
 * - Sorted feature flags for stability
 * - All fields included
 * - SHA-256 hash algorithm
 * 
 * @param fingerprint - Compiler fingerprint
 * @returns Hexadecimal hash string
 */
export function computeFingerprintHash(fingerprint: CompilerFingerprint): string {
    // Sort feature flags for stable hash
    const sortedFlags = Array.from(fingerprint.featureFlags.entries())
        .sort(([k1], [k2]) => k1.localeCompare(k2))
        .map(([k, v]) => `${k}:${v}`)
        .join(',');

    // Create canonical representation
    const canonical = JSON.stringify({
        compilerVersion: fingerprint.compilerVersion,
        parserVersion: fingerprint.parserVersion,
        phpVersion: fingerprint.phpVersion,
        frameworkVersion: fingerprint.frameworkVersion,
        targetBackend: fingerprint.targetBackend,
        strictMode: fingerprint.strictMode,
        featureFlags: sortedFlags
    });

    // Compute SHA-256 hash
    return createHash('sha256').update(canonical).digest('hex');
}

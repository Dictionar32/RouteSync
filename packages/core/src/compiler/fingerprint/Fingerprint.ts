/**
 * Compiler fingerprinting for cache invalidation.
 * Feature flags are immutable relation tuples rather than host Map state.
 */
import { createHash } from 'crypto';
import { relationProject } from '../../semantic/foundation/relationalSequence';

export interface CompilerFingerprint {
    readonly compilerVersion: string;
    readonly parserVersion: string;
    readonly phpVersion: string;
    readonly frameworkVersion: string;
    readonly targetBackend: string;
    readonly strictMode: boolean;
    readonly featureFlags: readonly (readonly [string, boolean])[];
}

export function computeFingerprintHash(fingerprint: CompilerFingerprint): string {
    const sortedFlags = [...relationProject(fingerprint.featureFlags, ([key, value]) => `${key}:${value}`)]
        .sort()
        .join(',');
    const canonical = JSON.stringify({
        compilerVersion: fingerprint.compilerVersion,
        parserVersion: fingerprint.parserVersion,
        phpVersion: fingerprint.phpVersion,
        frameworkVersion: fingerprint.frameworkVersion,
        targetBackend: fingerprint.targetBackend,
        strictMode: fingerprint.strictMode,
        featureFlags: sortedFlags,
    });
    return createHash('sha256').update(canonical).digest('hex');
}

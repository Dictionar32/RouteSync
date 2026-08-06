/**
 * Compiler Fingerprint Module
 * 
 * This module provides compiler fingerprinting for cache invalidation
 * and build reproducibility.
 * 
 * Key components:
 * - CompilerFingerprint: Captures compiler settings and versions
 * - computeFingerprintHash: Stable hash computation
 */

export { CompilerFingerprint, computeFingerprintHash } from './Fingerprint';

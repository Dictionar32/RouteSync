/**
 * cacheCoordinator.ts
 *
 * Constructs cache descriptors for pass execution caching.
 *
 * @module compiler/passes/adapter
 */

import type { ArtifactKey } from '../../artifacts/types';
import type { CompilerPass } from '../CompilerPass';
import type { CompilationState } from '../CompilationState';
import type { CompilationContext } from '../CompilationContext';
import type { CacheDescriptor } from '../../cache/ArtifactCache';
import { computeFingerprintHash } from '../../fingerprint/Fingerprint';

export function createPassCacheDescriptor<
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[]
>(
    pass: CompilerPass<I, O>,
    state: CompilationState,
    context: CompilationContext
): CacheDescriptor {
    const fingerprint = context.getFingerprint();
    return {
        passName: pass.name,
        inputs: pass.inputWitnesses.map((witness) => {
            const artifact = witness.read(state);
            return {
                artifactKey: witness.key,
                inputHash: artifact.metadata.hash
            };
        }),
        compilerVersion: fingerprint.compilerVersion,
        optionsHash: computeFingerprintHash(fingerprint)
    };
}

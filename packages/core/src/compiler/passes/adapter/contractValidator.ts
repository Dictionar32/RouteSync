/**
 * contractValidator.ts
 *
 * Validates the runtime shape and consistency of CompilerPass contracts.
 *
 * @module compiler/passes/adapter
 */

import type { ArtifactKey } from '../../artifacts/types';
import type { CompilerPass } from '../CompilerPass';

function sameKeys(
    left: readonly ArtifactKey[],
    right: readonly ArtifactKey[],
): boolean {
    return (
        left.length === right.length &&
        left.every((key, index) => key === right[index])
    );
}

export function validatePassContract<
    I extends readonly ArtifactKey[],
    O extends readonly ArtifactKey[]
>(pass: CompilerPass<I, O>): void {
    const inputKeys = pass.inputWitnesses.map((witness) => witness.key);
    const declaredInputs = pass.descriptor.consumes;
    const declaredOutputs = pass.descriptor.produces;

    if (!sameKeys(inputKeys, declaredInputs)) {
        throw new Error(
            `Compiler pass ${pass.name} has an inconsistent input contract: ` +
            'input witnesses do not match descriptor.consumes',
        );
    }

    if (!sameKeys(pass.outputKeys, declaredOutputs)) {
        throw new Error(
            `Compiler pass ${pass.name} has an inconsistent output contract: ` +
            'outputKeys do not match descriptor.produces',
        );
    }

    const consumed = new Set(declaredInputs);
    for (const dependency of pass.requires) {
        if (!consumed.has(dependency.artifact)) {
            throw new Error(
                `Compiler pass ${pass.name} declares dependency on ${dependency.artifact} ` +
                'but does not consume that artifact',
            );
        }
    }
}

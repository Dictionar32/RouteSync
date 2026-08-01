/**
 * @file ContractEmitter.ts
 * @description Base interface untuk contract emitters
 */

import type { BackendCapability } from './BackendCapability';
import type { GeneratedArtifact } from './GeneratedArtifact';
import type { ContractGraph } from '../ir/ContractGraph';

/**
 * Base interface untuk emitters yang generate code dari ContractGraph
 * 
 * Implementors harus provide:
 * - Capability flags untuk target backend
 * - Emit method untuk generate artifacts dari graph
 * 
 * @example
 * ```typescript
 * class MyEmitter implements ContractEmitter {
 *   public readonly capability: BackendCapability = {
 *     supportsGenerics: true,
 *     supportsNullable: true,
 *     supportsReadonly: true
 *   };
 *   
 *   public emit(graph: ContractGraph): readonly GeneratedArtifact[] {
 *     // Generate code dari graph
 *     return artifacts;
 *   }
 * }
 * ```
 */
export interface ContractEmitter {
    /** Capability flags untuk target backend */
    readonly capability: BackendCapability;

    /**
     * Generate code artifacts dari contract graph
     * 
     * @param graph - Contract graph untuk emit
     * @returns Array of generated file artifacts
     */
    emit(graph: ContractGraph): readonly GeneratedArtifact[];
}

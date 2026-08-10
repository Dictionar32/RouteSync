/**
 * @file IEmitter.ts
 * @description Interface contracts untuk Emitter layer
 * 
 * Emitter layer bertanggung jawab traverse Target AST dan emit text representation.
 * Emitter adalah PURE VISITOR - TIDAK boleh ada domain logic.
 * 
 * CRITICAL RULES:
 * - Emitter HANYA printing (traverse AST → emit string)
 * - NO domain logic (no collectImports, mapType, resolveEntity)
 * - NO type inference
 * - NO import collection
 * - Pure visitor pattern
 */

import type { ITargetNode, ITargetVisitor } from '../target/ITargetNode';

/**
 * Base interface untuk emitters
 * 
 * Generic parameter T adalah type dari root AST node yang akan di-emit.
 * 
 * REQUIREMENTS:
 * - Pure visitor pattern
 * - No domain logic
 * - Only syntax printing
 * - Type-safe (no any types)
 * 
 * @example
 * ```typescript
 * class TypeScriptEmitter implements IEmitter<TSFile>, TSVisitor<string> {
 *   emit(node: TSFile): string {
 *     return node.accept(this);
 *   }
 *   
 *   visitInterfaceDeclaration(node: TSInterfaceDeclaration): string {
 *     // ONLY printing, NO logic
 *     return `export interface ${node.name} { ... }`;
 *   }
 * }
 * ```
 */
export interface IEmitter<T extends ITargetNode> {
    /**
     * Emit text representation dari AST node
     * 
     * REQUIREMENTS:
     * - Pure function (no side effects)
     * - Deterministic (same AST → same output)
     * - Only printing (no logic)
     * 
     * @param node - AST node to emit
     * @returns Text representation (Promise untuk async compatibility)
     * @throws EmitterError jika emission fails
     */
    emit(node: T): string | Promise<string>;
}

/**
 * Emitter configuration options
 */
export interface EmitterConfig {
    /** Indentation string (e.g., '  ', '    ', '\t') */
    readonly indent?: string;

    /** Line ending style */
    readonly lineEnding?: '\n' | '\r\n';

    /** Emit comments or strip them */
    readonly emitComments?: boolean;

    /** Additional formatting options */
    readonly formatting?: Readonly<{
        readonly spacesAroundOperators?: boolean;
        readonly trailingCommas?: boolean;
    }>;
}

/**
 * Emitter error untuk type-safe error handling
 */
export class EmitterError extends Error {
    constructor(
        message: string,
        public readonly cause?: Error,
        public readonly context?: Readonly<Record<string, unknown>>
    ) {
        super(message);
        this.name = 'EmitterError';
        Object.freeze(this);
    }
}

/**
 * Result type untuk emission operations
 */
export interface EmissionResult {
    /** Generated text code */
    readonly code: string;

    /** Metadata about emission process */
    readonly metadata: Readonly<{
        readonly linesGenerated: number;
        readonly charactersGenerated: number;
        readonly emissionTimeMs?: number;
    }>;
}

/**
 * Base visitor interface untuk emitters
 * 
 * Emitters should extend this dan implement visit methods untuk specific node types.
 * Return type adalah string (generated code).
 */
export interface IEmitterVisitor extends ITargetVisitor<string> {
    /**
     * Default result returns empty string
     */
    defaultResult(): string;
}

/**
 * Streaming emitter untuk large ASTs
 * 
 * Instead of returning complete string, emit chunks incrementally.
 */
export interface IStreamingEmitter<T extends ITargetNode> {
    /**
     * Emit AST node as async generator
     * 
     * @param node - AST node to emit
     * @yields Chunks of generated code
     */
    emitStream(node: T): AsyncGenerator<string, void, undefined>;
}


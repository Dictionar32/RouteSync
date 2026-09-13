/**
 * @file generatorErrors.ts
 * @description Custom Error classes and PropertyDefinition contract for TypeScriptGenerator
 *
 * @module compiler/generators/typescript/domain/generatorErrors
 */

import type { SemanticType } from '../../../types/SemanticType';

/**
 * Error thrown during type conversion from SemanticType to TypeScript type
 */
export class TypeConversionError extends Error {
    constructor(
        message: string,
        public readonly sourceType: SemanticType,
        public readonly hint?: string
    ) {
        super(message);
        this.name = 'TypeConversionError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TypeConversionError);
        }
    }

    /**
     * Get formatted error message with context
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}\n`;
        msg += `  Source Type: ${this.sourceType.kind}\n`;

        if (this.hint) {
            msg += `  Hint: ${this.hint}\n`;
        }

        return msg;
    }
}

/**
 * Error thrown during interface generation from ObjectType
 */
export class InterfaceGenerationError extends Error {
    constructor(
        message: string,
        public readonly interfaceName: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'InterfaceGenerationError';

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InterfaceGenerationError);
        }
    }

    /**
     * Get formatted error message with context
     */
    public getDetailedMessage(): string {
        let msg = `${this.name}: ${this.message}\n`;
        msg += `  Interface Name: ${this.interfaceName}\n`;

        if (this.cause) {
            msg += `  Cause: ${this.cause.message}\n`;
        }

        return msg;
    }
}

/**
 * Property definition extracted from EntityNode or ObjectType
 */
export interface PropertyDefinition {
    readonly name: string;
    readonly type: SemanticType;
    readonly optional: boolean;
    readonly readonly: boolean;
    readonly description?: string;
}

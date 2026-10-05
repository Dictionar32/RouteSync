/**
 * ConversionResult.ts
 *
 * Unified Cross-Domain Observable Result Container Value Object with Encapsulated Constructor Defaults.
 * (0% ?. and 0% ?? defensive fallback inside constructor body - destructuring defaults at boundary)
 *
 * @module compiler/domain/common
 */

/**
 * Options contract for ConversionResult constructor
 */
import { relationResolve } from '../../../semantic/foundation/relationalSequence';

export interface ConversionResultOptions<T> {
    readonly fields?: readonly T[];
    readonly warnings?: readonly string[];
}

/**
 * Observable Result Container Value Object
 */
export class ConversionResult<T> {
    /** Encapsulated Singleton for frozen empty warning array (0% GC memory allocation churn) */
    public static readonly EMPTY_WARNINGS: readonly string[] = Object.freeze([]);
    public static readonly EMPTY_FIELDS: readonly never[] = Object.freeze([]);

    /** Encapsulated Singleton for frozen empty field array */
    public static emptyFields<T>(): readonly T[] { return Object.freeze([]); }

    public readonly fields: readonly T[];
    public readonly warnings: readonly string[];

    /**
     * Pure Constructor Boundary with Destructuring Defaults
     * (0% ?. and 0% ?? nullish coalescing in body)
     */
    constructor({
        fields = ConversionResult.emptyFields<T>(),
        warnings = ConversionResult.EMPTY_WARNINGS
    }: ConversionResultOptions<T> = {}) {
        this.fields = fields;
        this.warnings = warnings;
        Object.freeze(this);
    }
}

/** Relation-native witness factory for production lowering code. */
export function createConversionResult<T>(options: ConversionResultOptions<T> = {}): ConversionResult<T> {
    const fields = relationResolve(Object.prototype.hasOwnProperty.call(options, 'fields'), () => options.fields as readonly T[], () => ConversionResult.emptyFields<T>());
    const warnings = relationResolve(Object.prototype.hasOwnProperty.call(options, 'warnings'), () => options.warnings as readonly string[], () => ConversionResult.EMPTY_WARNINGS);
    return Object.freeze({ fields, warnings }) as ConversionResult<T>;
}

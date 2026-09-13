/**
 * types.ts
 *
 * Types for Model Symbol Table and Property Bindings.
 *
 * @module compiler/scanner/symbols/model
 */

export interface ResolvedPropertyBinding {
    readonly kind: 'column' | 'relation' | 'accessor';
    readonly propertyName: string;
    readonly type: string;
    readonly nullable: boolean;
    readonly targetModel?: string;
    readonly isCollection?: boolean;
    readonly cast?: string;
}

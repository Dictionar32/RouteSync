/**
 * compositeBinders.ts
 *
 * Specialized binders for resource collections, nested arrays, literals, ternaries, and raw expressions.
 * Active Consumer: Orchestrates composite resource binders.
 *
 * @module core/compiler/scanner/binders/resource/compositeBinders
 */

export {
    bindResourceCollectionField,
    bindNestedArrayField,
    bindLiteralField,
    bindTernaryField,
    bindShortTernaryField,
    bindCastField,
    bindFallbackField
} from './composite/index';

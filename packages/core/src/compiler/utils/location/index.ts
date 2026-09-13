/**
 * Location Subdomain Index.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/utils/location
 */

export { LineMap } from './lineMap';
export {
    spanToRange,
    rangeToSpan,
    createFileSpan,
    spanEnd,
    spanContains,
    compareSpans,
    mergeSpans
} from './spanOperations';

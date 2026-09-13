/**
 * Source location utilities for FileSpan conversion and mapping.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module compiler/utils
 */

import {
    LineMap,
    spanToRange,
    rangeToSpan,
    createFileSpan,
    spanEnd,
    spanContains,
    compareSpans,
    mergeSpans
} from './location';

export {
    LineMap,
    spanToRange,
    rangeToSpan,
    createFileSpan,
    spanEnd,
    spanContains,
    compareSpans,
    mergeSpans
};

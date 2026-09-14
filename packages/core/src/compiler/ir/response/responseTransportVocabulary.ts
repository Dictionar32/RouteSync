/**
 * responseTransportVocabulary.ts
 *
 * Domain Vocabulary and Confidence Score for HTTP Response transport.
 *
 * @module compiler/ir/response
 */

export const InferenceMethod = Object.freeze({
    Explicit: 'explicit',
    Inferred: 'inferred',
    Heuristic: 'heuristic',
    Fallback: 'fallback'
} as const);

export type InferenceMethod = typeof InferenceMethod[keyof typeof InferenceMethod];

export interface ConfidenceScoreContract {
    readonly score: number;
    readonly reasons: readonly string[];
    readonly method: InferenceMethod;
}

export type ConfidenceScore = {
    readonly score: number;
    readonly reasons: readonly string[];
    readonly method: InferenceMethod;
};

export const TransportKind = Object.freeze({
    Resource: 'resource',
    Model: 'model',
    Json: 'json',
    Primitive: 'primitive',
    Binary: 'binary',
    Stream: 'stream',
    Redirect: 'redirect',
    Empty: 'empty'
} as const);

export type TransportKind = typeof TransportKind[keyof typeof TransportKind];

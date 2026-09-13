/**
 * responseDescriptors.ts
 *
 * Domain Vocabulary and Descriptor types for HTTP Response transport and confidence scoring.
 * Pure IR analysis definitions without backend/generator concerns.
 *
 * @module compiler/ir/response
 */

/**
 * InferenceMethod
 *
 * Canonical Domain Vocabulary identifying the response analysis inference method.
 */
export const InferenceMethod = Object.freeze({
    Explicit: 'explicit',
    Inferred: 'inferred',
    Heuristic: 'heuristic',
    Fallback: 'fallback'
} as const);

export type InferenceMethod = typeof InferenceMethod[keyof typeof InferenceMethod];

/**
 * Confidence score with transparency rationale
 */
export interface ConfidenceScore {
    /** Score 0.0-1.0 (1.0 = fully confident, 0.0 = pure guess) */
    readonly score: number;

    /** Human-readable reasons for this score */
    readonly reasons: readonly string[];

    /** Inference method used */
    readonly method: InferenceMethod;
}

/**
 * TransportKind
 *
 * Canonical Domain Vocabulary identifying the HTTP response transport mechanism.
 */
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

/**
 * ResponseDescriptor: Pure HTTP transport metadata
 *
 * Describes HOW response is transmitted over HTTP.
 * Payload data shape is encapsulated in ResponseBody.
 */
export interface ResponseDescriptor {
    /** Transport mechanism type */
    readonly transport: TransportKind;

    /** HTTP status code */
    readonly status?: number;

    /** MIME type */
    readonly contentType?: string;

    /** Can return null/void */
    readonly nullable?: boolean;

    /** Binary content disposition */
    readonly contentDisposition?: {
        readonly type: 'inline' | 'attachment';
        readonly filename?: string;
    };

    /** Redirect metadata */
    readonly redirect?: {
        readonly type: 'route' | 'url' | 'back' | 'action';
        readonly target?: string;
        readonly parameters?: Record<string, unknown>;
    };

    /** Stream metadata */
    readonly stream?: {
        readonly chunked: boolean;
        readonly callback?: string;
    };
}

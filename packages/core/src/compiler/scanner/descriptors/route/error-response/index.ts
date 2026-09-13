/**
 * Error Response Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module core/compiler/scanner/descriptors/route/error-response
 */

export {
    type ScannedHttpErrorResponseParams
} from './types';

export {
    createErrorParams,
    createValidationParams,
    createUnauthorizedParams,
    createForbiddenParams,
    createNotFoundParams,
    createServerErrorParams,
    createCustomParams
} from './errorFactories';

export {
    ScannedHttpErrorResponseDescriptor
} from './ScannedHttpErrorResponseDescriptor';

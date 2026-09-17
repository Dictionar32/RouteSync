/**
 * types.ts
 *
 * Types for HTTP error response descriptors.
 *
 * @module compiler/scanner/descriptors/route/error-response
 */

import type { HttpErrorKind, HttpStatusCode, HttpErrorSchema } from "../../../../../types/route";

export interface ScannedHttpErrorResponseParams {
    readonly kind: HttpErrorKind;
    readonly statusCode: HttpStatusCode;
    readonly name: string;
    readonly typeName: string;
    readonly schema: HttpErrorSchema;
}

/**
 * errorFactories.ts
 *
 * Pre-defined factory creators for standard HTTP error response descriptors.
 *
 * @module compiler/scanner/descriptors/route/error-response
 */

import {
    HttpErrorKind,
    HTTP_ERROR_KIND_REGISTRY,
    HttpStatusCode
} from "../../../../../types/route";
import type { ScannedHttpErrorResponseParams } from "./types";

export function createErrorParams(params: {
    readonly kind?: HttpErrorKind;
    readonly statusCode?: HttpStatusCode;
    readonly name?: string;
    readonly typeName?: string;
    readonly schema?: Record<string, unknown>;
} = {}): ScannedHttpErrorResponseParams {
    const kind = params.kind ?? HttpErrorKind.Custom;
    const spec = HTTP_ERROR_KIND_REGISTRY[kind];
    const name = params.name !== undefined ? params.name : spec.defaultName;
    const typeName = params.typeName !== undefined ? params.typeName : (params.name ? `${params.name}Error` : spec.defaultTypeName);
    const statusCode = params.statusCode !== undefined ? params.statusCode : spec.defaultStatusCode;
    const schema = params.schema ?? {
        type: "object",
        properties: {
            message: { typeName: "string", nullable: false }
        }
    };

    return {
        kind,
        statusCode,
        name,
        typeName,
        schema: Object.freeze({ ...schema })
    };
}

export function createValidationParams(): ScannedHttpErrorResponseParams {
    return {
        kind: HttpErrorKind.Validation,
        statusCode: HttpStatusCode.UnprocessableEntity,
        name: "UnprocessableEntity",
        typeName: "LaravelValidationError",
        schema: Object.freeze({
            type: "object",
            properties: {
                message: { typeName: "string", nullable: false },
                errors: { typeName: "Record<string, string[]>", nullable: false }
            }
        })
    };
}

export function createUnauthorizedParams(): ScannedHttpErrorResponseParams {
    return {
        kind: HttpErrorKind.Unauthorized,
        statusCode: HttpStatusCode.Unauthorized,
        name: "Unauthorized",
        typeName: "LaravelUnauthorizedError",
        schema: Object.freeze({
            type: "object",
            properties: {
                message: { typeName: "string", nullable: false }
            }
        })
    };
}

export function createForbiddenParams(): ScannedHttpErrorResponseParams {
    return {
        kind: HttpErrorKind.Forbidden,
        statusCode: HttpStatusCode.Forbidden,
        name: "Forbidden",
        typeName: "LaravelForbiddenError",
        schema: Object.freeze({
            type: "object",
            properties: {
                message: { typeName: "string", nullable: false }
            }
        })
    };
}

export function createNotFoundParams(): ScannedHttpErrorResponseParams {
    return {
        kind: HttpErrorKind.NotFound,
        statusCode: HttpStatusCode.NotFound,
        name: "NotFound",
        typeName: "LaravelNotFoundError",
        schema: Object.freeze({
            type: "object",
            properties: {
                message: { typeName: "string", nullable: false }
            }
        })
    };
}

export function createServerErrorParams(): ScannedHttpErrorResponseParams {
    return {
        kind: HttpErrorKind.ServerError,
        statusCode: HttpStatusCode.InternalServerError,
        name: "InternalServerError",
        typeName: "LaravelServerError",
        schema: Object.freeze({
            type: "object",
            properties: {
                message: { typeName: "string", nullable: false }
            }
        })
    };
}

export function createCustomParams(
    statusCode: HttpStatusCode,
    name: string,
    typeName?: string,
    schema?: Record<string, unknown>
): ScannedHttpErrorResponseParams {
    return {
        kind: HttpErrorKind.Custom,
        statusCode,
        name,
        typeName: typeName !== undefined ? typeName : `${name}Error`,
        schema: Object.freeze(schema ? { ...schema } : {
            type: "object",
            properties: {
                message: { typeName: "string", nullable: false }
            }
        })
    };
}

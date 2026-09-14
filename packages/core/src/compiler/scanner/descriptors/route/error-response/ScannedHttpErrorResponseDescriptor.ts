/**
 * ScannedHttpErrorResponseDescriptor.ts
 *
 * ScannedHttpErrorResponseDescriptor class implementation.
 *
 * @module compiler/scanner/descriptors/route/error-response
 */

import type {
    HttpErrorResponseDescriptor,
    HttpErrorKind,
    HttpStatusCode
} from "../../../../../types/route";
import type { ScannedHttpErrorResponseParams } from "./types";
import {
    createErrorParams,
    createValidationParams,
    createUnauthorizedParams,
    createForbiddenParams,
    createNotFoundParams,
    createServerErrorParams,
    createCustomParams
} from "./errorFactories";

export class ScannedHttpErrorResponseDescriptor implements HttpErrorResponseDescriptor {
    public readonly kind: HttpErrorKind;
    public readonly statusCode: HttpStatusCode;
    public readonly name: string;
    public readonly typeName: string;
    public readonly schema: Record<string, unknown>;

    constructor(params: ScannedHttpErrorResponseParams) {
        this.kind = params.kind;
        this.statusCode = params.statusCode;
        this.name = params.name;
        this.typeName = params.typeName;
        this.schema = params.schema;
        Object.freeze(this);
    }

    public static create(params: {
        readonly kind?: HttpErrorKind;
        readonly statusCode?: HttpStatusCode;
        readonly name?: string;
        readonly typeName?: string;
        readonly schema?: Record<string, unknown>;
    } = {}): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor(createErrorParams(params));
    }

    public static validation(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor(createValidationParams());
    }

    public static unprocessableEntity(): ScannedHttpErrorResponseDescriptor {
        return ScannedHttpErrorResponseDescriptor.validation();
    }

    public static unauthorized(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor(createUnauthorizedParams());
    }

    public static forbidden(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor(createForbiddenParams());
    }

    public static notFound(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor(createNotFoundParams());
    }

    public static serverError(): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor(createServerErrorParams());
    }

    public static badRequest(): ScannedHttpErrorResponseDescriptor {
        return ScannedHttpErrorResponseDescriptor.custom(400 as HttpStatusCode, "BadRequest", "LaravelBadRequestError");
    }

    public static internalServerError(): ScannedHttpErrorResponseDescriptor {
        return ScannedHttpErrorResponseDescriptor.serverError();
    }

    public static custom(
        statusCode: HttpStatusCode,
        name: string,
        typeName?: string,
        schema?: Record<string, unknown>
    ): ScannedHttpErrorResponseDescriptor {
        return new ScannedHttpErrorResponseDescriptor(
            createCustomParams(statusCode, name, typeName, schema)
        );
    }
}

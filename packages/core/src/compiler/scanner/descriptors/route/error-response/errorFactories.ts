import { HttpErrorKind, HTTP_ERROR_KIND_REGISTRY, HttpStatusCode } from "../../../../../types/route";
import type { HttpErrorSchema } from "../../../../../types/route";
import type { ScannedHttpErrorResponseParams } from "./types";

const messageSchema = (): HttpErrorSchema => ({ kind: 'object', fields: [['message', { typeName: 'string', nullable: false }]] });
const validationSchema = (): HttpErrorSchema => ({ kind: 'object', fields: [
    ['message', { typeName: 'string', nullable: false }],
    ['errors', { typeName: 'Record<string, string[]>', nullable: false }]
] });

export function createErrorParams(params: {
    readonly kind?: HttpErrorKind;
    readonly statusCode?: HttpStatusCode;
    readonly name?: string;
    readonly typeName?: string;
    readonly schema?: HttpErrorSchema;
} = {}): ScannedHttpErrorResponseParams {
    const kind = params.kind ?? HttpErrorKind.Custom;
    const spec = HTTP_ERROR_KIND_REGISTRY[kind];
    const name = params.name ?? spec.defaultName;
    const typeName = params.typeName ?? (params.name ? `${params.name}Error` : spec.defaultTypeName);
    const statusCode = params.statusCode ?? spec.defaultStatusCode;
    return { kind, statusCode, name, typeName, schema: params.schema ?? messageSchema() };
}

export function createValidationParams(): ScannedHttpErrorResponseParams {
    return { kind: HttpErrorKind.Validation, statusCode: HttpStatusCode.UnprocessableEntity, name: 'UnprocessableEntity', typeName: 'LaravelValidationError', schema: validationSchema() };
}
export function createUnauthorizedParams(): ScannedHttpErrorResponseParams {
    return { kind: HttpErrorKind.Unauthorized, statusCode: HttpStatusCode.Unauthorized, name: 'Unauthorized', typeName: 'LaravelUnauthorizedError', schema: messageSchema() };
}
export function createForbiddenParams(): ScannedHttpErrorResponseParams {
    return { kind: HttpErrorKind.Forbidden, statusCode: HttpStatusCode.Forbidden, name: 'Forbidden', typeName: 'LaravelForbiddenError', schema: messageSchema() };
}
export function createNotFoundParams(): ScannedHttpErrorResponseParams {
    return { kind: HttpErrorKind.NotFound, statusCode: HttpStatusCode.NotFound, name: 'NotFound', typeName: 'LaravelNotFoundError', schema: messageSchema() };
}
export function createServerErrorParams(): ScannedHttpErrorResponseParams {
    return { kind: HttpErrorKind.ServerError, statusCode: HttpStatusCode.InternalServerError, name: 'InternalServerError', typeName: 'LaravelServerError', schema: messageSchema() };
}
export function createCustomParams(statusCode: HttpStatusCode, name: string, typeName?: string, schema?: HttpErrorSchema): ScannedHttpErrorResponseParams {
    return { kind: HttpErrorKind.Custom, statusCode, name, typeName: typeName ?? `${name}Error`, schema: schema ?? messageSchema() };
}

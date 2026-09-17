/** Resolves typed controller-body AST facts into domain descriptors. */
import type { ControllerBodyAst } from '../../lexer/controllerBodyAstTypes';
import type { PhpStatement } from '../../lexer/phpAstTypes';
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { RouteValidationRuleEntry, HttpErrorResponseDescriptor } from '../../../../types/route';
import { ScannedRouteValidationRuleEntry } from '../../descriptors/validationDescriptors';
import { ScannedHttpErrorResponseDescriptor } from '../../descriptors/routeDescriptors';

export interface ControllerBodyResolution {
    readonly statements: readonly PhpStatement[];
    readonly dataflow: ControllerDataflowAst;
    readonly schemaRules: readonly RouteValidationRuleEntry[];
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

export function resolveControllerBody(body: ControllerBodyAst): ControllerBodyResolution {
    const schemaRules = body.validations.map(validation =>
        ScannedRouteValidationRuleEntry.create(validation.field, validation.rules)
    );
    const errorResponses: HttpErrorResponseDescriptor[] = [];
    for (const error of body.errors) {
        const descriptor = resolveKnownError(error.status);
        if (descriptor) errorResponses.push(descriptor);
    }
    return Object.freeze({
        statements: Object.freeze([...body.statements]),
        dataflow: body.dataflow,
        schemaRules: Object.freeze(schemaRules),
        errorResponses: Object.freeze(errorResponses),
    });
}

function resolveKnownError(status: number): HttpErrorResponseDescriptor | undefined {
    switch (status) {
        case 400: return ScannedHttpErrorResponseDescriptor.badRequest();
        case 401: return ScannedHttpErrorResponseDescriptor.unauthorized();
        case 403: return ScannedHttpErrorResponseDescriptor.forbidden();
        case 404: return ScannedHttpErrorResponseDescriptor.notFound();
        case 422: return ScannedHttpErrorResponseDescriptor.unprocessableEntity();
        case 500: return ScannedHttpErrorResponseDescriptor.internalServerError();
        default: return undefined;
    }
}

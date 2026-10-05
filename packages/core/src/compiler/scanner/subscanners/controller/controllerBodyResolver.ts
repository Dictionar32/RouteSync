/** Resolves typed controller-body AST facts into domain descriptors. */
import type { ControllerBodyAst } from '../../lexer/controllerBodyAstTypes';
import type { PhpStatement } from '../../lexer/phpAstTypes';
import type { ControllerDataflowAst } from '../../lexer/controllerBodyAstTypes';
import type { RouteSchemaPayload, HttpErrorResponseDescriptor } from '../../../../types/route';
import { createRouteSchemaPayload } from '../../../../types/domain/validationRules';
import { ScannedRouteValidationRuleEntry } from '../../descriptors/validation/validationRuleEntry';
import { RouteSemanticFlowValidationRuleSet } from '../../descriptors/validation/validationRuleSet';
import { TypeInterner } from '../../../types/TypeInterner';
import { httpErrorResponseBadRequest, httpErrorResponseUnauthorized, httpErrorResponseForbidden, httpErrorResponseNotFound, httpErrorResponseValidation, httpErrorResponseServerError } from '../../../../types/domain/httpErrors';
import { relationProject, relationExpand, relationOptionFold, relationNone, relationSome, type RelationOption } from '../../../../semantic/foundation/relationalSequence';
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationFirst } from '../../../../semantic/foundation/relationalSequence';

export interface ControllerBodyResolution {
    readonly statements: readonly PhpStatement[];
    readonly dataflow: ControllerDataflowAst;
    readonly schema: RouteSchemaPayload;
    readonly errorResponses: readonly HttpErrorResponseDescriptor[];
}

const KNOWN_ERRORS: readonly (readonly [number, () => HttpErrorResponseDescriptor])[] = Object.freeze([
    [400, (): HttpErrorResponseDescriptor => httpErrorResponseBadRequest()],
    [401, (): HttpErrorResponseDescriptor => httpErrorResponseUnauthorized()],
    [403, (): HttpErrorResponseDescriptor => httpErrorResponseForbidden()],
    [404, (): HttpErrorResponseDescriptor => httpErrorResponseNotFound()],
    [422, (): HttpErrorResponseDescriptor => httpErrorResponseValidation()],
    [500, (): HttpErrorResponseDescriptor => httpErrorResponseServerError()],
]);

const resolveKnownError = (status: number): RelationOption<HttpErrorResponseDescriptor> =>
    relationOptionFold(
        relationFirst(KNOWN_ERRORS, entry => relationEqual(entry[0], status)),
        () => relationNone(),
        entry => relationSome(entry[1]()),
    );

export function resolveControllerBody(body: ControllerBodyAst): ControllerBodyResolution {
    const validationEntries = relationProject(body.validations, validation =>
        ScannedRouteValidationRuleEntry.create(validation.field, validation.rules));
    const fields = RouteSemanticFlowValidationRuleSet.create(validationEntries, TypeInterner.create()).fields;
    const schema = createRouteSchemaPayload(fields);
    const errorResponses = relationProject(body.errors, error => resolveKnownError(error.status));
    const resolvedErrors = relationExpand(errorResponses, result =>
        relationOptionFold(result, () => Object.freeze([] as readonly HttpErrorResponseDescriptor[]), descriptor => Object.freeze([descriptor])));
    return Object.freeze({
        statements: Object.freeze(relationProject(body.statements, statement => statement)),
        dataflow: body.dataflow,
        schema,
        errorResponses: Object.freeze(resolvedErrors),
    });
}

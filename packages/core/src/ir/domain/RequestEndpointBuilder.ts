/**
 * @file RequestEndpointBuilder.ts
 * @description Sub-domain builder for RequestIR, EndpointIR, parameters, references, and validation
 *
 * @module core/ir/domain/RequestEndpointBuilder
 */

import type {
    ContractIR,
    ResourceIR,
    RequestIR,
    EndpointIR,
    ParsedRequest,
    ParsedRoute,
    ManifestField,
    ManifestAction,
    RequestActionIR,
    ParameterIR,
    ResponseReference,
    RequestReference
} from '../../types/ir';

import type { PrimitiveKind } from '../../compiler/types/SemanticType';
import type { FieldTypeResolver } from './FieldTypeResolver';
import type { ResourceMapperBuilder } from './ResourceMapperBuilder';
import type { DiagnosticCollector } from './irTypes';
import {
    inferParamType,
    extractPathParams,
    buildRequestReference,
    buildResponseReference,
    generateRequestId,
    validateContractIR
} from './request-endpoint';

export class RequestEndpointBuilder {
    constructor(
        private readonly fieldTypeResolver: FieldTypeResolver,
        private readonly mapperBuilder: ResourceMapperBuilder
    ) {}

    public buildRequestIR(request: ParsedRequest): RequestIR {
        const actions = request.actions.map(action => this.buildRequestAction(action));

        return {
            id: this.generateRequestId(request),
            name: request.name,
            actions,
            validation: {
                zod: undefined,
                laravel: undefined,
                custom: []
            },
            metadata: {
                sourceFile: request.name,
                controller: request.controller,
                routes: request.routes,
                generated_at: new Date().toISOString()
            }
        };
    }

    public buildRequestAction(action: ManifestAction): RequestActionIR {
        return {
            name: action.name === 'Create' || action.name === 'Update' || action.name === 'Delete'
                ? action.name
                : 'Custom',
            customName: action.name !== 'Create' && action.name !== 'Update' && action.name !== 'Delete'
                ? action.name
                : undefined,
            fields: action.fields.map((field: ManifestField) =>
                this.fieldTypeResolver.convertToLegacyFieldIR(
                    this.fieldTypeResolver.buildOptimizedResourceField(field)
                )
            ),
            rules: action.validation ? [this.mapperBuilder.buildValidationRules(action.validation)] : [],
            dependencies: []
        };
    }

    public buildEndpointIR(
        route: ParsedRoute,
        resources: Map<string, ResourceIR>,
        requests: Map<string, RequestIR>
    ): EndpointIR {
        return {
            id: route.id,
            method: route.method,
            path: route.path,
            pathParams: this.extractPathParams(route.path),
            queryParams: [],
            request: this.buildRequestReference(route, requests),
            response: this.buildResponseReference(route, resources),
            middleware: route.middleware.map((name, index) => ({
                name,
                parameters: [],
                order: index
            })),
            metadata: {
                controller: route.controller,
                action: route.action,
                generated_at: new Date().toISOString()
            }
        };
    }

    public extractPathParams(path: string): ParameterIR[] {
        return extractPathParams(path);
    }

    public inferParamType(name: string): PrimitiveKind {
        return inferParamType(name);
    }

    public buildRequestReference(route: ParsedRoute, requests: Map<string, RequestIR>): RequestReference | undefined {
        return buildRequestReference(route, requests);
    }

    public buildResponseReference(route: ParsedRoute, resources: Map<string, ResourceIR>): ResponseReference {
        return buildResponseReference(route, resources);
    }

    public generateRequestId(request: ParsedRequest): string {
        return generateRequestId(request);
    }

    public validateIR(ir: ContractIR, diagnostics: DiagnosticCollector): void {
        validateContractIR(ir, diagnostics);
    }
}

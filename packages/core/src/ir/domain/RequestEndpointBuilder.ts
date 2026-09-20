/**
 * @file RequestEndpointBuilder.ts
 * @description Builds request/endpoint IR from resolved upstream contracts.
 */

import type {
    ContractIR,
    ResourceIR,
    RequestIR,
    EndpointIR,
    ParsedRequest,
    ParsedRoute,
    ManifestAction,
    RequestActionIR,
    ParameterIR,
    ResponseReference,
    RequestReference
} from '../../types/ir';
import type { ParsedRoute as DomainParsedRoute } from '../../types/domain/routes';

import type { PrimitiveKind } from '../../compiler/types/SemanticType';
import type { FieldTypeResolver } from './FieldTypeResolver';
import type { DiagnosticCollector } from './irTypes';
import {
    inferParamType,
    extractPathParams,
    buildRequestReference,
    buildResponseReference,
    generateRequestId,
    validateContractIR
} from './request-endpoint';
import { createRequestId, createRequestName } from '../../types/ir/nominalVocabulary';

export class RequestEndpointBuilder {
    constructor(private readonly fieldTypeResolver: FieldTypeResolver) {}

    public buildRequestIR(request: ParsedRequest): RequestIR {
        return {
            id: createRequestId(this.generateRequestId(request)),
            name: createRequestName(request.name),
            actions: request.actions.map(action => this.buildRequestAction(action)),
            metadata: {
                sourceFile: request.sourceFile,
                controller: request.controller,
                routes: request.routes,
                generated_at: new Date().toISOString() as import('../../types/upstream/valueObjects').GenerationTimestamp
            }
        };
    }

    public buildRequestAction(action: ManifestAction): RequestActionIR {
        return {
            name: action.name,
            fields: action.fields.map(field =>
                this.fieldTypeResolver.convertToLegacyFieldIR(
                    this.fieldTypeResolver.buildOptimizedResourceField(field)
                )
            )
        };
    }

    public buildEndpointIR(route: DomainParsedRoute, requests: Map<string, RequestIR>): EndpointIR {
        return {
            id: route.identity.name,
            method: route.identity.method,
            path: route.identity.path,
            pathParams: this.extractPathParams(route.identity.path),
            queryParams: [],
            request: this.buildRequestReference(route, requests),
            response: this.buildResponseReference(route),
            middleware: route.capability.middleware.map((name, index) => ({
                name,
                parameters: [],
                order: index
            })),
            metadata: {
                controller: route.binding.controllerName,
                action: route.binding.action,
                routeName: route.identity.name,
                generatedAt: new Date().toISOString() as import('../../types/upstream/valueObjects').GenerationTimestamp,
                security: { kind: 'public' },
                cache: { kind: 'uncached' }
            }
        };
    }

    public extractPathParams(path: DomainParsedRoute['identity']['path']): ParameterIR[] {
        return extractPathParams(path);
    }

    public inferParamType(name: string): PrimitiveKind {
        return inferParamType(name);
    }

    public buildRequestReference(route: DomainParsedRoute, requests: Map<string, RequestIR>): RequestReference {
        return buildRequestReference(route, requests);
    }

    public buildResponseReference(route: DomainParsedRoute): ResponseReference {
        return buildResponseReference(route);
    }

    public generateRequestId(request: ParsedRequest): string {
        return generateRequestId(request);
    }

    public validateIR(ir: ContractIR, diagnostics: DiagnosticCollector): void {
        validateContractIR(ir, diagnostics);
    }
}

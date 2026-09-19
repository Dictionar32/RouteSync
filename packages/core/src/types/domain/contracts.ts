import type { RouteManifest } from "./base";
import {
  CrudRole,
  type RouteCacheInvalidationDescriptor,
  type RouteExecutionSignature,
  RouteHookKind,
} from "./lifecycle";
import type { RouteParameter } from "./parameters";
import {
  DataProvenanceKind,
  type EndpointProvenanceDescriptor,
  type ProvenanceSourceRef,
  ScannedEndpointProvenanceDescriptor
} from "./provenance";
import { type ResponseDescriptor, ResponseShape, matchResponse } from "./responses";
import { matchRouteHandler } from "./routeHandlers";
import type {
  ParsedRoute,
  RouteIdentityContract,
  RouteBindingContract,
  RouteCapabilityContract,
  RouteProvenanceContract
} from "./routes";
import {
  type HttpMethod,
  HttpStatusCode,
  matchHttpMethod,
  type RequestContentType,
  type RoutePolicyDescriptor,
  type RouteQueryParameter,
  type RouteSecurityDescriptor
} from "./security";
import type { RouteSchemaPayload } from "./validation";
import type { RouteName, RoutePath, DomainName, ResourceName, PropertyName, ResponseTypeName, HttpErrorName } from "./semanticValues";
import type { HttpErrorSchema } from "./httpErrors";

// ============================================================================
// ENDPOINT CONTRACT ADT & COMPLETE CONTRACT ARCHITECTURE (CDA)
// ============================================================================

export interface EndpointRequestBodyContract {
  readonly present: boolean;
  readonly contentType: RequestContentType;
  readonly schema: RouteSchemaPayload;
  readonly fields: readonly import("./request").RequestField[];
}

export interface EndpointRequestContract {
  readonly hasBody: boolean;
  readonly body: EndpointRequestBodyContract;
  readonly pathParameters: readonly RouteParameter[];
  readonly queryParameters: readonly RouteQueryParameter[];
  readonly contentType: RequestContentType;
  readonly schema: RouteSchemaPayload;
  readonly executionSignature: RouteExecutionSignature;
  readonly security: RouteSecurityDescriptor;
}

export interface ItemEndpointRequestContract extends EndpointRequestContract {
  readonly primaryPathParameter: RouteParameter;
}

export interface ItemEndpointContract extends EndpointContract {
  readonly request: ItemEndpointRequestContract;
}

export interface EndpointSuccessResponseContract {
  readonly statusCode: HttpStatusCode;
  readonly descriptor: ResponseDescriptor;
}

export interface EndpointErrorResponseContract {
  readonly statusCode: HttpStatusCode;
  readonly name: HttpErrorName;
  readonly typeName: ResponseTypeName;
  readonly schema: HttpErrorSchema;
}

export interface EndpointResponseContract {
  readonly success: EndpointSuccessResponseContract;
  readonly errors: readonly EndpointErrorResponseContract[];
  readonly errorUnionType: ResponseTypeName;
}


export interface EndpointContract<
  TMethod extends HttpMethod = HttpMethod,
  TRole extends CrudRole = CrudRole
> {
  readonly id: RouteName;
  readonly name: RouteName;
  readonly method: TMethod;
  readonly path: RoutePath;
  readonly runtimePath: RoutePath;
  readonly groupName: DomainName;
  readonly resourceName: ResourceName;
  readonly crudRole: TRole;
  readonly isMutating: boolean;
  readonly hookKind: RouteHookKind;
  readonly request: EndpointRequestContract;
  readonly response: EndpointResponseContract;
  readonly invalidation: RouteCacheInvalidationDescriptor;
  readonly policies: readonly RoutePolicyDescriptor[];
  readonly provenance: EndpointProvenanceDescriptor; // Canonical provenance SSOT
}

export class ScannedEndpointContract implements EndpointContract {
  public readonly id: RouteName;
  public readonly name: RouteName;
  public readonly method: HttpMethod;
  public readonly path: RoutePath;
  public readonly runtimePath: RoutePath;
  public readonly groupName: DomainName;
  public readonly resourceName: ResourceName;
  public readonly crudRole: CrudRole;
  public readonly isMutating: boolean;
  public readonly hookKind: RouteHookKind;
  public readonly request: EndpointRequestContract;
  public readonly response: EndpointResponseContract;
  public readonly invalidation: RouteCacheInvalidationDescriptor;
  public readonly policies: readonly RoutePolicyDescriptor[];
  public readonly provenance: EndpointProvenanceDescriptor;

  constructor(params: EndpointContract) {
    this.id = params.id;
    this.name = params.name;
    this.method = params.method;
    this.path = params.path;
    this.runtimePath = params.runtimePath;
    this.groupName = params.groupName;
    this.resourceName = params.resourceName;
    this.crudRole = params.crudRole;
    this.isMutating = params.isMutating;
    this.hookKind = params.hookKind;
    this.request = Object.freeze({ ...params.request });
    this.response = Object.freeze({
      ...params.response,
      errors: Object.freeze([...params.response.errors])
    });
    this.invalidation = params.invalidation;
    this.policies = Object.freeze([...params.policies]);
    this.provenance = params.provenance;
    Object.freeze(this);
  }

  public static fromRoute(route: ParsedRoute): ScannedEndpointContract {
    return ScannedEndpointContract.fromSubcontracts({
      identity: route.identity,
      binding: route.binding,
      capability: route.capability,
      provenance: route.provenance
    });
  }

  public static fromSubcontracts(subcontracts: {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
  }): ScannedEndpointContract {
    const errors = Object.freeze(subcontracts.capability.errorResponses.map(error => ({
      statusCode: error.statusCode,
      name: error.name,
      typeName: error.typeName,
      schema: error.schema
    })));

    const responseAnalysis = subcontracts.binding.response.toAnalysis(
      subcontracts.identity.name,
      100
    );
    const successStatus = matchHttpMethod(subcontracts.identity.method, {
      POST: () => HttpStatusCode.Created,
      GET: () => responseAnalysis.kind === 'void' ? HttpStatusCode.NoContent : HttpStatusCode.Ok,
      DELETE: () => HttpStatusCode.NoContent,
      PUT: () => HttpStatusCode.Ok,
      PATCH: () => HttpStatusCode.Ok,
      OPTIONS: () => HttpStatusCode.NoContent,
      HEAD: () => HttpStatusCode.Ok
    });

    const hasBody =
      subcontracts.capability.executionSignature.hasPayload ||
      subcontracts.binding.schema.fields.length > 0;

    const request: EndpointRequestContract = {
      hasBody,
      body: {
        present: hasBody,
        contentType: subcontracts.capability.requestContentType,
        schema: subcontracts.binding.schema,
        fields: subcontracts.binding.schema.fields
      },
      pathParameters: subcontracts.identity.parameters.path,
      queryParameters: subcontracts.identity.parameters.query,
      contentType: subcontracts.capability.requestContentType,
      schema: subcontracts.binding.schema,
      executionSignature: subcontracts.capability.executionSignature,
      security: subcontracts.capability.security
    };

    const routeSource: ProvenanceSourceRef = {
      kind: DataProvenanceKind.RouteDefinition,
      file: subcontracts.provenance.sourceFile.value,
      line: subcontracts.provenance.sourceLine.value,
      symbol: `${subcontracts.identity.method} ${subcontracts.identity.path.value}`
    };

    const provenance = ScannedEndpointProvenanceDescriptor.create({
      route: routeSource,
      controller: null,
      request: null,
      response: null
    });

    return new ScannedEndpointContract({
      id: subcontracts.identity.name,
      name: subcontracts.identity.name,
      method: subcontracts.identity.method,
      path: subcontracts.identity.path,
      runtimePath: subcontracts.identity.runtimePath,
      groupName: subcontracts.identity.groupName,
      resourceName: subcontracts.identity.resourceName,
      crudRole: subcontracts.capability.crudRole,
      isMutating: subcontracts.capability.isMutating,
      hookKind: subcontracts.capability.hookKind,
      request,
      response: {
        success: {
          statusCode: successStatus,
          descriptor: subcontracts.binding.response
        },
        errors,
        errorUnionType: responseTypeNameToName(responseAnalysis)
      },
      invalidation: subcontracts.capability.invalidation,
      policies: subcontracts.capability.policies,
      provenance
    });
  }

}

function responseTypeNameToName(analysis: { readonly kind: string; readonly typeName?: ResponseTypeName }): ResponseTypeName {
  if (analysis.kind === 'inline' && analysis.typeName) return analysis.typeName;
  if (analysis.kind === 'resource') return responseTypeNameForResource(analysis);
  if (analysis.kind === 'model') return responseTypeNameForModel(analysis);
  return { kind: 'response_type_name', value: 'void' };
}

function responseTypeNameForResource(analysis: { readonly kind: string; readonly resourceName?: ResourceName }): ResponseTypeName {
  return { kind: 'response_type_name', value: analysis.resourceName ? `${analysis.resourceName.value}Response` : 'ResourceResponse' };
}

function responseTypeNameForModel(analysis: { readonly kind: string; readonly modelName?: { readonly value: string } }): ResponseTypeName {
  return { kind: 'response_type_name', value: analysis.modelName ? `${analysis.modelName.value}Response` : 'ModelResponse' };
}

export function createEndpointContract(route: ParsedRoute): EndpointContract {
  return ScannedEndpointContract.fromRoute(route);
}

export interface EndpointResponseVisitor<R> {
  readonly success: (success: EndpointSuccessResponseContract) => R;
  readonly error: (errors: readonly EndpointErrorResponseContract[], errorUnion: string) => R;
}

export function matchEndpointResponse<R>(
  responseContract: EndpointResponseContract,
  visitor: EndpointResponseVisitor<R>
): R {
  return visitor.success(responseContract.success);
}

/**
 * Guarantees a non-null EndpointContract from any ParsedRoute.
 */
export function getRouteContract(route: ParsedRoute): EndpointContract {
  return route.contract;
}

/**
 * Builds an O(1) Map of contracts keyed by contract id / action name.
 */
export function getManifestContractMap(manifest: RouteManifest): Map<RouteName, EndpointContract> {
  const map = new Map<RouteName, EndpointContract>();
  const contracts = manifest.contracts;
  for (const c of contracts) {
    map.set(c.id, c);
  }
  return map;
}


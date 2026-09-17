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
  readonly name: string;
  readonly typeName: string;
  readonly schema: Record<string, unknown>;
}

export interface EndpointResponseContract {
  readonly success: EndpointSuccessResponseContract;
  readonly errors: readonly EndpointErrorResponseContract[];
  readonly errorUnionType: string;
}


export interface EndpointContract<
  TMethod extends HttpMethod = HttpMethod,
  TRole extends CrudRole = CrudRole
> {
  readonly id: string;
  readonly name: string;
  readonly method: TMethod;
  readonly path: string;
  readonly runtimePath: string;
  readonly groupName: string;
  readonly resourceName: string;
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
  public readonly id: string;
  public readonly name: string;
  public readonly method: HttpMethod;
  public readonly path: string;
  public readonly runtimePath: string;
  public readonly groupName: string;
  public readonly resourceName: string;
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
    const errorList: EndpointErrorResponseContract[] = route.errorResponses.map(err => ({
      statusCode: err.statusCode,
      name: err.name,
      typeName: err.typeName,
      schema: err.schema
    }));

    const errorUnionType = errorList.length > 0
      ? Array.from(new Set(errorList.map(e => e.typeName))).join(' | ')
      : 'ApiError';

    const upperMethod = route.method.toUpperCase() as HttpMethod;
    const defaultStatusCode = matchHttpMethod(upperMethod, {
      POST: () => HttpStatusCode.Created,
      GET: () => (route.response.readTypeName === 'void' ? HttpStatusCode.NoContent : HttpStatusCode.Ok),
      DELETE: () => HttpStatusCode.NoContent,
      PUT: () => HttpStatusCode.Ok,
      PATCH: () => HttpStatusCode.Ok,
      OPTIONS: () => HttpStatusCode.NoContent,
      HEAD: () => HttpStatusCode.Ok
    });

    const readTypeName = route.response.readTypeName;

    const successContract: EndpointSuccessResponseContract = {
      statusCode: defaultStatusCode,
      descriptor: route.response,
      readTypeName,
      validatorName: route.response.validatorName,
      mapperName: route.response.mapperName,
      shape: route.response.shape
    };

    const hasBody = route.executionSignature.hasPayload || route.schema.fields.length > 0;

    const normalizedPathParams: readonly RouteParameter[] = route.pathParameters;

    const requestContract: EndpointRequestContract = {
      hasBody,
      body: {
        present: hasBody,
        contentType: route.requestContentType,
        schema: route.schema,
        fields: route.schema.fields
      },
      pathParameters: normalizedPathParams,
      queryParameters: route.queryParameters,
      contentType: route.requestContentType,
      schema: route.schema,
      executionSignature: route.executionSignature,
      security: route.security
    };

    const group = route.groupName;
    const action = route.actionName;
    const crudRole = route.crudRole;
    const isMutating = route.isMutating;
    const hookKind = route.hookKind;

    const routeSource: ProvenanceSourceRef = {
      kind: DataProvenanceKind.RouteDefinition,
      file: route.sourceFile,
      line: route.sourceLine,
      symbol: `${route.method.toUpperCase()} ${route.path}`
    };

    const controllerSource: ProvenanceSourceRef | null = matchRouteHandler(route.handler, {
      controllerAction: h => ({
        kind: DataProvenanceKind.ControllerAction,
        file: route.sourceFile,
        line: route.sourceLine,
        symbol: h.target
      }),
      invokableController: h => ({
        kind: DataProvenanceKind.ControllerAction,
        file: route.sourceFile,
        line: route.sourceLine,
        symbol: h.target
      }),
      closure: () => null
    });

    const primaryFormRequest = route.formRequests[0];
    const requestSource: ProvenanceSourceRef | null = primaryFormRequest === undefined
      ? null
      : {
          kind: DataProvenanceKind.FormRequest,
          file: primaryFormRequest.sourceFile,
          line: 1,
          symbol: primaryFormRequest.name
        };

    const responseSource: ProvenanceSourceRef | null = matchResponse<ProvenanceSourceRef | null>(route.response, {
          resource: r => ({
            kind: DataProvenanceKind.JsonResource,
            file: `app/Http/Resources/${r.resourceName}.php`,
            line: 1,
            symbol: r.resourceName
          }),
          model: m => ({
            kind: DataProvenanceKind.EloquentModel,
            file: `app/Models/${m.modelName}.php`,
            line: 1,
            symbol: m.modelName
          }),
          inline: () => null,
          void: () => null
        });

    const provenance = ScannedEndpointProvenanceDescriptor.create({
      route: routeSource,
      controller: controllerSource,
      request: requestSource,
      response: responseSource
    });

    const normalizedRuntimePath = route.runtimePath;

    return new ScannedEndpointContract({
      id: route.name,
      name: action,
      method: route.method,
      path: route.path,
      runtimePath: normalizedRuntimePath,
      groupName: group,
      resourceName: route.resourceName,
      crudRole,
      isMutating,
      hookKind,
      request: requestContract,
      response: {
        success: successContract,
        errors: errorList,
        errorUnionType
      },
      invalidation: route.invalidation,
      policies: route.policies,
      provenance,
    });
  }

  public static fromSubcontracts(subcontracts: {
    readonly identity: RouteIdentityContract;
    readonly binding: RouteBindingContract;
    readonly capability: RouteCapabilityContract;
    readonly provenance: RouteProvenanceContract;
  }): ScannedEndpointContract {
    const errorList: EndpointErrorResponseContract[] = subcontracts.capability.errorResponses.map(err => ({
      statusCode: err.statusCode,
      name: err.name,
      typeName: err.typeName,
      schema: err.schema
    }));

    const errorUnionType = errorList.length > 0
      ? Array.from(new Set(errorList.map(e => e.typeName))).join(' | ')
      : 'ApiError';

    const upperMethod = subcontracts.identity.method.toUpperCase() as HttpMethod;
    const resp = subcontracts.binding.response;
    const defaultStatusCode = matchHttpMethod(upperMethod, {
      POST: () => HttpStatusCode.Created,
      GET: () => (resp.readTypeName === 'void' ? HttpStatusCode.NoContent : HttpStatusCode.Ok),
      DELETE: () => HttpStatusCode.NoContent,
      PUT: () => HttpStatusCode.Ok,
      PATCH: () => HttpStatusCode.Ok,
      OPTIONS: () => HttpStatusCode.NoContent,
      HEAD: () => HttpStatusCode.Ok
    });

    const readTypeName = resp.readTypeName;

    const successContract: EndpointSuccessResponseContract = {
      statusCode: defaultStatusCode,
      descriptor: subcontracts.binding.response,
      readTypeName,
      validatorName: resp.validatorName,
      mapperName: resp.mapperName,
      shape: resp.shape
    };

    const hasBody = subcontracts.capability.executionSignature.hasPayload || subcontracts.binding.schema.fields.length > 0;

    const requestContract: EndpointRequestContract = {
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

    const group = subcontracts.identity.groupName;
    const action = subcontracts.binding.actionName;

    const routeSource: ProvenanceSourceRef = {
      kind: DataProvenanceKind.RouteDefinition,
      file: subcontracts.provenance.sourceFile,
      line: subcontracts.provenance.sourceLine,
      symbol: `${subcontracts.identity.method.toUpperCase()} ${subcontracts.identity.path}`
    };

    const controllerSource: ProvenanceSourceRef | null = matchRouteHandler(subcontracts.binding.handler, {
      controllerAction: h => ({
        kind: DataProvenanceKind.ControllerAction,
        file: subcontracts.provenance.sourceFile,
        line: subcontracts.provenance.sourceLine,
        symbol: h.target
      }),
      invokableController: h => ({
        kind: DataProvenanceKind.ControllerAction,
        file: subcontracts.provenance.sourceFile,
        line: subcontracts.provenance.sourceLine,
        symbol: h.target
      }),
      closure: () => null
    });

    const primaryFormRequest = subcontracts.binding.formRequests[0];
    const requestSource: ProvenanceSourceRef | null = primaryFormRequest === undefined
      ? null
      : {
          kind: DataProvenanceKind.FormRequest,
          file: primaryFormRequest.sourceFile,
          line: 1,
          symbol: primaryFormRequest.name
        };

    const responseSource: ProvenanceSourceRef | null = matchResponse<ProvenanceSourceRef | null>(subcontracts.binding.response, {
          resource: r => ({
            kind: DataProvenanceKind.JsonResource,
            file: `app/Http/Resources/${r.resourceName}.php`,
            line: 1,
            symbol: r.resourceName
          }),
          model: m => ({
            kind: DataProvenanceKind.EloquentModel,
            file: `app/Models/${m.modelName}.php`,
            line: 1,
            symbol: m.modelName
          }),
          inline: () => null,
          void: () => null
        });

    const provenance = ScannedEndpointProvenanceDescriptor.create({
      route: routeSource,
      controller: controllerSource,
      request: requestSource,
      response: responseSource
    });

    return new ScannedEndpointContract({
      id: subcontracts.identity.name,
      name: action,
      method: subcontracts.identity.method,
      path: subcontracts.identity.path,
      runtimePath: subcontracts.identity.runtimePath,
      groupName: group,
      resourceName: subcontracts.identity.resourceName,
      crudRole: subcontracts.capability.crudRole,
      isMutating: subcontracts.capability.isMutating,
      hookKind: subcontracts.capability.hookKind,
      request: requestContract,
      response: {
        success: successContract,
        errors: errorList,
        errorUnionType
      },
      invalidation: subcontracts.capability.invalidation,
      policies: subcontracts.capability.policies,
      provenance
    });
  }
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
export function getManifestContractMap(manifest: RouteManifest): Map<string, EndpointContract> {
  const map = new Map<string, EndpointContract>();
  const contracts = manifest.contracts;
  for (const c of contracts) {
    map.set(c.id, c);
  }
  return map;
}


import type { RouteManifest } from "./base";
import {
  CrudRole,
  type RouteCacheInvalidationDescriptor,
  type RouteExecutionSignature,
  RouteHookKind,
  ScannedRouteCacheInvalidationDescriptor
} from "./lifecycle";
import { type RouteParameter, RouteParameterType } from "./parameters";
import {
  DataProvenanceKind,
  type EndpointProvenanceDescriptor,
  type ProvenanceSourceRef,
  ScannedEndpointProvenanceDescriptor
} from "./provenance";
import { type ResponseDescriptor, ResponseShape, matchResponse, RESPONSE_DESCRIPTOR_REGISTRY } from "./responses";
import { matchRouteHandler } from "./routeHandlers";
import type {
  ParsedRoute,
  RouteIdentityContract,
  RouteBindingContract,
  RouteCapabilityContract,
  RouteProvenanceContract
} from "./routes";
import {
  HTTP_METHOD_REGISTRY,
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

export interface EndpointRequestContract {
  readonly hasBody: boolean;
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
  readonly readTypeName: string;
  readonly validatorName: string;
  readonly mapperName: string;
  readonly shape: ResponseShape;
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
  readonly provenance: EndpointProvenanceDescriptor; // ✅ Pure End-to-End Data Provenance SSOT
  readonly raw: ParsedRoute;
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
  public readonly raw: ParsedRoute;

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
    this.invalidation = params.invalidation ?? ScannedRouteCacheInvalidationDescriptor.empty();
    this.policies = Object.freeze([...params.policies]);
    this.provenance = params.provenance;
    this.raw = params.raw;
    Object.freeze(this);
  }

  public static fromRoute(route: ParsedRoute): ScannedEndpointContract {
    const errorList: EndpointErrorResponseContract[] = (route.errorResponses ?? []).map(err => ({
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
      GET: () => (route.response?.readTypeName === 'void' ? HttpStatusCode.NoContent : HttpStatusCode.Ok),
      DELETE: () => HttpStatusCode.NoContent,
      PUT: () => HttpStatusCode.Ok,
      PATCH: () => HttpStatusCode.Ok,
      OPTIONS: () => HttpStatusCode.NoContent,
      HEAD: () => HttpStatusCode.Ok
    });

    const rawResp = route.response as any;
    const readTypeName = route.response?.readTypeName
      ?? rawResp?.semantic?.readTypeName
      ?? (rawResp?.resource ? `${rawResp.resource}Transformed` : undefined)
      ?? (rawResp?.model ? `${rawResp.model}Transformed` : undefined)
      ?? 'unknown';

    const successContract: EndpointSuccessResponseContract = {
      statusCode: defaultStatusCode,
      descriptor: route.response,
      readTypeName,
      validatorName: route.response?.validatorName ?? 'undefined',
      mapperName: route.response?.mapperName ?? 'identity',
      shape: route.response?.shape ?? ResponseShape.Single
    };

    const hasBody = Boolean(route.schema?.rules && (Array.isArray(route.schema.rules) ? route.schema.rules.length > 0 : Object.keys(route.schema.rules).length > 0));

    const normalizedPathParams: readonly RouteParameter[] = route.pathParameters ?? (
      route.path
        ? [...route.path.matchAll(/\{([^}]+)\}/g)].map(m => {
            const rawParam = m[1].split(':')[0];
            const isId = rawParam.toLowerCase() === 'id' || rawParam.toLowerCase().endsWith('id');
            const paramType = isId ? RouteParameterType.Number : RouteParameterType.String;
            return {
              name: rawParam,
              propertyName: rawParam,
              type: paramType,
              in: 'path' as const
            };
          })
        : []
    );

    const requestContract: EndpointRequestContract = {
      hasBody,
      pathParameters: normalizedPathParams,
      queryParameters: route.queryParameters ?? [],
      contentType: route.requestContentType,
      schema: route.schema,
      executionSignature: route.executionSignature,
      security: route.security
    };

    const group = route.groupName || route.resourceName || 'App';
    const action = route.actionName || 'action';
    const crudRole = route.crudRole ?? CrudRole.Custom;
    const isMutating = route.isMutating ?? (HTTP_METHOD_REGISTRY[route.method as HttpMethod]?.isMutating ?? false);
    const hookKind = route.hookKind ?? (isMutating ? RouteHookKind.Mutation : RouteHookKind.Query);

    const routeSource: ProvenanceSourceRef = {
      kind: DataProvenanceKind.RouteDefinition,
      file: route.sourceFile || 'routes/api.php',
      line: route.sourceLine || 1,
      symbol: `${route.method.toUpperCase()} ${route.path}`
    };

    const controllerSource: ProvenanceSourceRef | null = route.handler
      ? matchRouteHandler(route.handler, {
          controllerAction: h => ({
            kind: DataProvenanceKind.ControllerAction,
            file: route.sourceFile || `app/Http/Controllers/${h.controllerName}.php`,
            line: route.sourceLine || 1,
            symbol: h.target
          }),
          invokableController: h => ({
            kind: DataProvenanceKind.ControllerAction,
            file: route.sourceFile || `app/Http/Controllers/${h.controllerName}.php`,
            line: route.sourceLine || 1,
            symbol: h.target
          }),
          closure: () => null
        })
      : (route.controllerName
        ? {
            kind: DataProvenanceKind.ControllerAction,
            file: route.sourceFile || `app/Http/Controllers/${route.controllerName}.php`,
            line: route.sourceLine || 1,
            symbol: `${route.controllerName}@${route.actionName || 'action'}`
          }
        : null);

    const formRequests = route.formRequests ?? [];
    const primaryFormRequest = formRequests[0];
    const requestSource: ProvenanceSourceRef | null = (route.schema?.rules && primaryFormRequest)
      ? {
          kind: DataProvenanceKind.FormRequest,
          file: primaryFormRequest.sourceFile,
          line: 1,
          symbol: primaryFormRequest.name
        }
      : null;

    const responseSource: ProvenanceSourceRef | null = (route.response && route.response.kind && (route.response.kind in RESPONSE_DESCRIPTOR_REGISTRY))
      ? matchResponse<ProvenanceSourceRef | null>(route.response, {
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
        })
      : null;

    const provenance = ScannedEndpointProvenanceDescriptor.create({
      route: routeSource,
      controller: controllerSource,
      request: requestSource,
      response: responseSource
    });

    const normalizedRuntimePath = route.runtimePath ?? (
      route.path ? route.path.replace(/\{([^}/]+)\}/g, ':$1') : '/'
    );

    return new ScannedEndpointContract({
      id: route.name || `${group}.${action}`,
      name: action,
      method: route.method as HttpMethod,
      path: route.path,
      runtimePath: normalizedRuntimePath,
      groupName: group,
      resourceName: route.resourceName ?? group,
      crudRole,
      isMutating,
      hookKind,
      request: requestContract,
      response: {
        success: successContract,
        errors: errorList,
        errorUnionType
      },
      invalidation: route.invalidation ?? ScannedRouteCacheInvalidationDescriptor.empty(),
      policies: route.policies ?? [],
      provenance,
      raw: route
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
      GET: () => ((resp && resp.readTypeName === 'void') ? HttpStatusCode.NoContent : HttpStatusCode.Ok),
      DELETE: () => HttpStatusCode.NoContent,
      PUT: () => HttpStatusCode.Ok,
      PATCH: () => HttpStatusCode.Ok,
      OPTIONS: () => HttpStatusCode.NoContent,
      HEAD: () => HttpStatusCode.Ok
    });

    const rawResp = subcontracts.binding.response as any;
    const readTypeName = (resp && resp.readTypeName)
      ? resp.readTypeName
      : (rawResp && rawResp.semantic && rawResp.semantic.readTypeName
        ? rawResp.semantic.readTypeName
        : (rawResp && rawResp.resource ? `${rawResp.resource}Transformed` : (rawResp && rawResp.model ? `${rawResp.model}Transformed` : 'unknown')));

    const successContract: EndpointSuccessResponseContract = {
      statusCode: defaultStatusCode,
      descriptor: subcontracts.binding.response,
      readTypeName,
      validatorName: (resp && resp.validatorName) ? resp.validatorName : 'undefined',
      mapperName: (resp && resp.mapperName) ? resp.mapperName : 'identity',
      shape: (resp && resp.shape) ? resp.shape : ResponseShape.Single
    };

    const hasBody = Boolean(subcontracts.binding.schema && subcontracts.binding.schema.rules && (Array.isArray(subcontracts.binding.schema.rules) ? subcontracts.binding.schema.rules.length > 0 : Object.keys(subcontracts.binding.schema.rules).length > 0));

    const requestContract: EndpointRequestContract = {
      hasBody,
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
      file: subcontracts.provenance.sourceFile ? subcontracts.provenance.sourceFile : 'routes/api.php',
      line: subcontracts.provenance.sourceLine ? subcontracts.provenance.sourceLine : 1,
      symbol: `${subcontracts.identity.method.toUpperCase()} ${subcontracts.identity.path}`
    };

    const controllerSource: ProvenanceSourceRef | null = subcontracts.binding.handler
      ? matchRouteHandler(subcontracts.binding.handler, {
          controllerAction: h => ({
            kind: DataProvenanceKind.ControllerAction,
            file: subcontracts.provenance.sourceFile ? subcontracts.provenance.sourceFile : `app/Http/Controllers/${h.controllerName}.php`,
            line: subcontracts.provenance.sourceLine ? subcontracts.provenance.sourceLine : 1,
            symbol: h.target
          }),
          invokableController: h => ({
            kind: DataProvenanceKind.ControllerAction,
            file: subcontracts.provenance.sourceFile ? subcontracts.provenance.sourceFile : `app/Http/Controllers/${h.controllerName}.php`,
            line: subcontracts.provenance.sourceLine ? subcontracts.provenance.sourceLine : 1,
            symbol: h.target
          }),
          closure: () => null
        })
      : null;

    const primaryFormRequest = subcontracts.binding.formRequests[0];
    const requestSource: ProvenanceSourceRef | null = (subcontracts.binding.schema && subcontracts.binding.schema.rules && primaryFormRequest)
      ? {
          kind: DataProvenanceKind.FormRequest,
          file: primaryFormRequest.sourceFile,
          line: 1,
          symbol: primaryFormRequest.name
        }
      : null;

    const responseSource: ProvenanceSourceRef | null = (subcontracts.binding.response && subcontracts.binding.response.kind && (subcontracts.binding.response.kind in RESPONSE_DESCRIPTOR_REGISTRY))
      ? matchResponse<ProvenanceSourceRef | null>(subcontracts.binding.response, {
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
        })
      : null;

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
      provenance,
      raw: {
        ...subcontracts.identity,
        ...subcontracts.binding,
        ...subcontracts.capability,
        ...subcontracts.provenance,
        identity: subcontracts.identity,
        binding: subcontracts.binding,
        capability: subcontracts.capability,
        provenance: subcontracts.provenance,
        contract: null as any
      } as unknown as ParsedRoute
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
  return route.contract ?? ScannedEndpointContract.fromRoute(route);
}

/**
 * Builds an O(1) Map of contracts keyed by contract id / action name.
 */
export function getManifestContractMap(manifest: RouteManifest): Map<string, EndpointContract> {
  const map = new Map<string, EndpointContract>();
  const contracts = manifest.contracts ?? manifest.routes.map(r => getRouteContract(r));
  for (const c of contracts) {
    map.set(c.id, c);
  }
  return map;
}


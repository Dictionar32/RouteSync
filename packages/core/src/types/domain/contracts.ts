import { ROUTE_ACTION_KIND_REGISTRY } from "./httpVocabulary";

import type { RouteManifest } from "./base";
import type { RouteExecutionSignature } from "./lifecycle";
import type { RouteParameter } from "./parameters";
import type { RouteParameterSpecification } from "./routes";

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
  type RouteSecurityDescriptor
} from "./security";
import type { RouteSchemaPayload } from "./validation";
import type { RouteName, RoutePath, DomainName, ResourceName, PropertyName, ResponseTypeName, HttpErrorName } from "./semanticValues";
import type { HttpErrorSchema } from "./httpErrors";
import { SemanticValueFactory } from './semanticValues';

// ============================================================================
// ENDPOINT CONTRACT ADT & COMPLETE CONTRACT ARCHITECTURE (CDA)
// ============================================================================

export interface EndpointRequestBodyContract {
  readonly kind: 'body';
  readonly contentType: RequestContentType;
  readonly schema: RouteSchemaPayload;
}

export interface EndpointNoBodyContract {
  readonly kind: 'no_body';
}

export type EndpointBodyContract = EndpointNoBodyContract | EndpointRequestBodyContract;

export interface EndpointRequestContract {
  readonly body: EndpointBodyContract;
  readonly parameters: RouteParameterSpecification;
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


export interface EndpointContract {
  readonly identity: RouteIdentityContract;
  readonly binding: RouteBindingContract;
  readonly capability: RouteCapabilityContract;
  readonly provenance: RouteProvenanceContract;
  readonly request: EndpointRequestContract;
  readonly response: EndpointResponseContract;
}

export class ScannedEndpointContract implements EndpointContract {
  public readonly identity: RouteIdentityContract;
  public readonly binding: RouteBindingContract;
  public readonly capability: RouteCapabilityContract;
  public readonly provenance: RouteProvenanceContract;
  public readonly request: EndpointRequestContract;
  public readonly response: EndpointResponseContract;

  constructor(params: EndpointContract) {
    this.identity = params.identity;
    this.binding = params.binding;
    this.capability = params.capability;
    this.provenance = params.provenance;
    this.request = Object.freeze({ ...params.request });
    this.response = Object.freeze({
      ...params.response,
      errors: Object.freeze([...params.response.errors])
    });
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

    const successStatus = matchHttpMethod(subcontracts.identity.coordinates.method, {
      POST: () => HttpStatusCode.Created,
      GET: () => subcontracts.binding.response.toSuccessStatusCode(),
      DELETE: () => HttpStatusCode.NoContent,
      PUT: () => HttpStatusCode.Ok,
      PATCH: () => HttpStatusCode.Ok,
      OPTIONS: () => HttpStatusCode.NoContent,
      HEAD: () => HttpStatusCode.Ok
    });

    const hasBody = subcontracts.capability.executionSignature.hasPayload;

    const body: EndpointBodyContract = hasBody
      ? {
          kind: 'body',
          contentType: subcontracts.capability.requestContentType,
          schema: subcontracts.binding.schema
        }
      : { kind: 'no_body' };

    const request: EndpointRequestContract = {
      body,
      parameters: subcontracts.identity.parameters,
      executionSignature: subcontracts.capability.executionSignature,
      security: subcontracts.capability.security
    };

    return new ScannedEndpointContract({
      identity: subcontracts.identity,
      binding: subcontracts.binding,
      capability: subcontracts.capability,
      provenance: subcontracts.provenance,
      request,
      response: {
        success: {
          statusCode: successStatus,
          descriptor: subcontracts.binding.response
        },
        errors,
        errorUnionType: subcontracts.binding.response.responseTypeName()
      },
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
export function getManifestContractMap(manifest: RouteManifest): Map<RouteName, EndpointContract> {
  const map = new Map<RouteName, EndpointContract>();
  const contracts = manifest.routes.map(route => route.contract);
  for (const c of contracts) {
    map.set(c.identity.coordinates.name, c);
  }
  return map;
}


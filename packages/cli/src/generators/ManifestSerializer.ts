/**
 * ManifestSerializer.ts
 *
 * Origin-boundary serialization for the RouteSync manifest.
 * Removes cyclic runtime links while preserving the complete semantic route.
 */

import type {
  EndpointContract,
  RouteSemanticFlow,
  RouteManifest
} from '@routesync/core'

export interface SerializableManifestRoute extends Omit<RouteSemanticFlow, 'contract'> {
  readonly contract: SerializableManifestContract;
  readonly identity: RouteSemanticFlow['identity'];
  readonly binding: RouteSemanticFlow['binding'];
  readonly capability: RouteSemanticFlow['capability'];
  readonly provenance: RouteSemanticFlow['provenance'];
}

export type SerializableManifestContract = EndpointContract;

export interface SerializableManifest extends Omit<RouteManifest, 'routes' | 'contracts'> {
  readonly routes: readonly SerializableManifestRoute[];
  readonly contracts: readonly SerializableManifestContract[];
}

export interface ManifestRouteSerializationOperationInterface {
  readonly serialize: (route: RouteSemanticFlow) => SerializableManifestRoute;
}

export interface ManifestContractSerializationOperationInterface {
  readonly serialize: (contract: EndpointContract) => SerializableManifestContract;
}

export const manifestRouteSerializationOperation: ManifestRouteSerializationOperationInterface = Object.freeze({
  serialize: (route: RouteSemanticFlow): SerializableManifestRoute => {
    const { contract: _contract, ...routeFields } = route;
    return Object.freeze({
      ...routeFields,
      contract: manifestContractSerializationOperation.serialize(route.contract),
      identity: route.identity,
      binding: route.binding,
      capability: route.capability,
      provenance: route.provenance,
    });
  },
});

export const manifestContractSerializationOperation: ManifestContractSerializationOperationInterface = Object.freeze({
  serialize: (contract: EndpointContract): SerializableManifestContract => {
    const serialized = contract;
    return Object.freeze({
      ...serialized,
      request: Object.freeze({
        ...serialized.request,
        body: Object.freeze({
          ...serialized.request.body,
          schema: serialized.request.body.schema,
        }),
        pathParameters: Object.freeze([...serialized.request.pathParameters]),
        queryParameters: Object.freeze([...serialized.request.queryParameters]),
      }),
      response: Object.freeze({
        ...serialized.response,
        errors: Object.freeze([...serialized.response.errors]),
      }),
      policies: Object.freeze([...serialized.policies]),
    });
  },
});

export interface ManifestSerializationHandlers<Result> {
  readonly onComplete: (judgment: ManifestSerializationCompleteJudgment) => Result;
  readonly onRejected: (judgment: ManifestSerializationRejectedJudgment) => Result;
}

export interface ManifestSerializationCompleteJudgment {
  readonly kind: 'manifest_serialization_complete';
  readonly manifest: SerializableManifest;
  readonly continueWith: <Result>(handlers: ManifestSerializationHandlers<Result>) => Result;
}

export interface ManifestSerializationRejectedJudgment {
  readonly kind: 'manifest_serialization_rejected';
  readonly message: string;
  readonly continueWith: <Result>(handlers: ManifestSerializationHandlers<Result>) => Result;
}

export type ManifestSerializationJudgment =
  | ManifestSerializationCompleteJudgment
  | ManifestSerializationRejectedJudgment;

export interface ManifestSerializationOperationsInterface {
  readonly serialize: (manifest: RouteManifest) => ManifestSerializationJudgment;
}

export interface ManifestSerializationJudgmentFactoryInterface {
  readonly complete: (manifest: SerializableManifest) => ManifestSerializationCompleteJudgment;
  readonly rejected: (message: string) => ManifestSerializationRejectedJudgment;
}

export const manifestSerializationJudgmentFactory: ManifestSerializationJudgmentFactoryInterface = Object.freeze({
  complete: (manifest: SerializableManifest): ManifestSerializationCompleteJudgment => {
    const judgment: ManifestSerializationCompleteJudgment = Object.freeze({
      kind: 'manifest_serialization_complete',
      manifest,
      continueWith: handlers => handlers.onComplete(judgment),
    });
    return judgment;
  },
  rejected: (message: string): ManifestSerializationRejectedJudgment => {
    const judgment: ManifestSerializationRejectedJudgment = Object.freeze({
      kind: 'manifest_serialization_rejected',
      message,
      continueWith: handlers => handlers.onRejected(judgment),
    });
    return judgment;
  },
});

export interface ManifestRuntimeSerializationOperationInterface {
  readonly serialize: (manifest: RouteManifest) => ManifestSerializationJudgment;
}

export const manifestRuntimeSerializationOperation: ManifestRuntimeSerializationOperationInterface = Object.freeze({
  serialize: (manifest: RouteManifest): ManifestSerializationJudgment => {
    try {
      const serialized: SerializableManifest = Object.freeze({
        version: manifest.version,
        baseURL: manifest.baseURL,
        routes: Object.freeze(manifest.routes.map(route => manifestRouteSerializationOperation.serialize(route))),
        contracts: Object.freeze(manifest.contracts.map(contract => manifestContractSerializationOperation.serialize(contract))),
        resources: Object.freeze([...manifest.resources]),
        models: Object.freeze([...manifest.models]),
        routeGroups: Object.freeze([...manifest.routeGroups]),
        requestTypes: Object.freeze([...manifest.requestTypes]),
        semanticTypes: Object.freeze([...manifest.semanticTypes]),
        generatedAt: manifest.generatedAt,
        channels: Object.freeze([...manifest.channels]),
        frontend: manifest.frontend,
        pages: Object.freeze([...manifest.pages]),
      });
      return manifestSerializationJudgmentFactory.complete(serialized);
    } catch (error: unknown) {
      return manifestSerializationJudgmentFactory.rejected(error instanceof Error ? error.message : String(error));
    }
  },
});

export const manifestSerializationOperations: ManifestSerializationOperationsInterface = Object.freeze({
  serialize: manifestRuntimeSerializationOperation.serialize,
});

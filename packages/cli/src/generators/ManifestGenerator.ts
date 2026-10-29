import {
  type RouteSemanticFlow,
  type RouteManifest,
  type ParsedChannel,
  type ResourceAst,
  type ModelAst,
  type ResourceRouteGroup,
  type FrontendConfig,
  type PageConfig,
  type RequestType,
  type ObjectType,
} from '@routesync/core'
import fs from 'fs-extra'
import { manifestContractValidationOperations } from './ManifestContractValidator'
import { manifestSerializationOperations } from './ManifestSerializer'

export interface ManifestGeneratorOptions {
  readonly routes: readonly RouteSemanticFlow[];
  readonly baseURL: string;
  readonly channels: readonly ParsedChannel[];
  readonly resources: readonly ResourceAst[];
  readonly models: readonly ModelAst[];
  readonly routeGroups: readonly ResourceRouteGroup[];
  readonly requestTypes: readonly RequestType[];
  readonly semanticTypes: readonly ObjectType[];
  readonly frontend: FrontendConfig;
  readonly pages: readonly PageConfig[];
  readonly version: string;
}

export interface ManifestGenerationHandlers<Result> {
  readonly onComplete: (judgment: ManifestGenerationCompleteJudgment) => Result;
  readonly onRejected: (judgment: ManifestGenerationRejectedJudgment) => Result;
}

export interface ManifestGenerationCompleteJudgment {
  readonly kind: 'manifest_generation_complete';
  readonly manifest: RouteManifest;
  readonly continueWith: <Result>(handlers: ManifestGenerationHandlers<Result>) => Result;
}

export interface ManifestGenerationRejectedJudgment {
  readonly kind: 'manifest_generation_rejected';
  readonly message: string;
  readonly continueWith: <Result>(handlers: ManifestGenerationHandlers<Result>) => Result;
}

export type ManifestGenerationJudgment =
  | ManifestGenerationCompleteJudgment
  | ManifestGenerationRejectedJudgment;

export interface ManifestGenerationJudgmentFactoryInterface {
  readonly complete: (manifest: RouteManifest) => ManifestGenerationCompleteJudgment;
  readonly rejected: (message: string) => ManifestGenerationRejectedJudgment;
}

export const manifestGenerationJudgmentFactory: ManifestGenerationJudgmentFactoryInterface = Object.freeze({
  complete: (manifest: RouteManifest): ManifestGenerationCompleteJudgment => {
    const judgment: ManifestGenerationCompleteJudgment = Object.freeze({
      kind: 'manifest_generation_complete',
      manifest,
      continueWith: handlers => handlers.onComplete(judgment),
    });
    return judgment;
  },
  rejected: (message: string): ManifestGenerationRejectedJudgment => {
    const judgment: ManifestGenerationRejectedJudgment = Object.freeze({
      kind: 'manifest_generation_rejected',
      message,
      continueWith: handlers => handlers.onRejected(judgment),
    });
    return judgment;
  },
});

export interface ManifestPersistenceHandlers<Result> {
  readonly onComplete: (judgment: ManifestPersistenceCompleteJudgment) => Result;
  readonly onContractRejected: (judgment: ManifestPersistenceContractRejectedJudgment) => Result;
  readonly onSerializationRejected: (judgment: ManifestPersistenceSerializationRejectedJudgment) => Result;
  readonly onWriteRejected: (judgment: ManifestPersistenceWriteRejectedJudgment) => Result;
}

export interface ManifestPersistenceCompleteJudgment {
  readonly kind: 'manifest_persistence_complete';
  readonly outputPath: string;
  readonly continueWith: <Result>(handlers: ManifestPersistenceHandlers<Result>) => Result;
}

export interface ManifestPersistenceContractRejectedJudgment {
  readonly kind: 'manifest_persistence_contract_rejected';
  readonly violations: readonly { readonly kind: 'manifest_contract_invariant_violated'; readonly message: string }[];
  readonly continueWith: <Result>(handlers: ManifestPersistenceHandlers<Result>) => Result;
}

export interface ManifestPersistenceSerializationRejectedJudgment {
  readonly kind: 'manifest_persistence_serialization_rejected';
  readonly message: string;
  readonly continueWith: <Result>(handlers: ManifestPersistenceHandlers<Result>) => Result;
}

export interface ManifestPersistenceWriteRejectedJudgment {
  readonly kind: 'manifest_persistence_write_rejected';
  readonly outputPath: string;
  readonly message: string;
  readonly continueWith: <Result>(handlers: ManifestPersistenceHandlers<Result>) => Result;
}

export type ManifestPersistenceJudgment =
  | ManifestPersistenceCompleteJudgment
  | ManifestPersistenceContractRejectedJudgment
  | ManifestPersistenceSerializationRejectedJudgment
  | ManifestPersistenceWriteRejectedJudgment;

const persistenceComplete = (outputPath: string): ManifestPersistenceCompleteJudgment => {
  const judgment: ManifestPersistenceCompleteJudgment = Object.freeze({
    kind: 'manifest_persistence_complete', outputPath,
    continueWith: handlers => handlers.onComplete(judgment),
  });
  return judgment;
};

const persistenceContractRejected = (violations: ManifestPersistenceContractRejectedJudgment['violations']): ManifestPersistenceContractRejectedJudgment => {
  const judgment: ManifestPersistenceContractRejectedJudgment = Object.freeze({
    kind: 'manifest_persistence_contract_rejected', violations,
    continueWith: handlers => handlers.onContractRejected(judgment),
  });
  return judgment;
};

const persistenceSerializationRejected = (message: string): ManifestPersistenceSerializationRejectedJudgment => {
  const judgment: ManifestPersistenceSerializationRejectedJudgment = Object.freeze({
    kind: 'manifest_persistence_serialization_rejected', message,
    continueWith: handlers => handlers.onSerializationRejected(judgment),
  });
  return judgment;
};

const persistenceWriteRejected = (outputPath: string, message: string): ManifestPersistenceWriteRejectedJudgment => {
  const judgment: ManifestPersistenceWriteRejectedJudgment = Object.freeze({
    kind: 'manifest_persistence_write_rejected', outputPath, message,
    continueWith: handlers => handlers.onWriteRejected(judgment),
  });
  return judgment;
};

export interface ManifestGeneratorOperationsInterface {
  readonly generate: (
    routes: readonly RouteSemanticFlow[],
    baseURL: string,
    channels?: readonly ParsedChannel[],
    resources?: readonly ResourceAst[],
    models?: readonly ModelAst[],
    routeGroups?: readonly ResourceRouteGroup[],
    requestTypes?: readonly RequestType[],
    semanticTypes?: readonly ObjectType[],
    frontend?: FrontendConfig | null,
    pages?: readonly PageConfig[],
    version?: string,
  ) => ManifestGenerationJudgment;
  readonly fromOptions: (options: ManifestGeneratorOptions) => ManifestGenerationJudgment;
  readonly save: (manifest: RouteManifest, outputPath: string) => Promise<ManifestPersistenceJudgment>;
}

export interface ManifestContractsFromRoutesOperationInterface {
  readonly derive: (routes: readonly RouteSemanticFlow[]) => readonly RouteSemanticFlow['contract'][];
}

export const manifestContractsFromRoutesOperation: ManifestContractsFromRoutesOperationInterface = Object.freeze({
  derive: (routes: readonly RouteSemanticFlow[]): readonly RouteSemanticFlow['contract'][] =>
    Object.freeze(routes.map(route => route.contract)),
});

export interface ManifestRuntimeGenerationOperationInterface {
  readonly generate: ManifestGeneratorOperationsInterface['generate'];
}

export const manifestRuntimeGenerationOperation: ManifestRuntimeGenerationOperationInterface = Object.freeze({
  generate: (
    routes: readonly RouteSemanticFlow[],
    baseURL: string,
    channels: readonly ParsedChannel[] = [],
    resources: readonly ResourceAst[] = [],
    models: readonly ModelAst[] = [],
    routeGroups: readonly ResourceRouteGroup[] = [],
    requestTypes: readonly RequestType[] = [],
    semanticTypes: readonly ObjectType[] = [],
    frontend: FrontendConfig | null = null,
    pages: readonly PageConfig[] = [],
    version = '1.0.0',
  ): ManifestGenerationJudgment => {
    try {
      const manifest: RouteManifest = Object.freeze({
        version,
        baseURL,
        routes: Object.freeze([...routes]),
        contracts: manifestContractsFromRoutesOperation.derive(routes),
        resources: Object.freeze([...resources]),
        models: Object.freeze([...models]),
        routeGroups: Object.freeze([...routeGroups]),
        requestTypes: Object.freeze([...requestTypes]),
        semanticTypes: Object.freeze([...semanticTypes]),
        channels: Object.freeze([...channels]),
        frontend,
        pages: Object.freeze([...pages]),
        generatedAt: new Date().toISOString(),
      });
      return manifestGenerationJudgmentFactory.complete(manifest);
    } catch (error: unknown) {
      return manifestGenerationJudgmentFactory.rejected(
        error instanceof Error ? error.message : String(error),
      );
    }
  },
});

export interface ManifestGenerationFromOptionsOperationInterface {
  readonly generate: (options: ManifestGeneratorOptions) => ManifestGenerationJudgment;
}

export const manifestGenerationFromOptionsOperation: ManifestGenerationFromOptionsOperationInterface = Object.freeze({
  generate: (options: ManifestGeneratorOptions): ManifestGenerationJudgment =>
    manifestRuntimeGenerationOperation.generate(
      options.routes,
      options.baseURL,
      options.channels,
      options.resources,
      options.models,
      options.routeGroups,
      options.requestTypes,
      options.semanticTypes,
      options.frontend,
      options.pages,
      options.version,
    ),
});

export interface ManifestRuntimePersistenceOperationInterface {
  readonly save: (manifest: RouteManifest, outputPath: string) => Promise<ManifestPersistenceJudgment>;
}

export const manifestRuntimePersistenceOperation: ManifestRuntimePersistenceOperationInterface = Object.freeze({
  save: async (manifest: RouteManifest, outputPath: string): Promise<ManifestPersistenceJudgment> => {
    const validation = manifestContractValidationOperations.validate(manifest);
    return validation.continueWith<Promise<ManifestPersistenceJudgment>>({
      onRejected: judgment => Promise.resolve(persistenceContractRejected(judgment.violations)),
      onValidated: async judgment => {
        const serialization = manifestSerializationOperations.serialize(judgment.manifest);
        return serialization.continueWith<Promise<ManifestPersistenceJudgment>>({
          onRejected: rejected => Promise.resolve(persistenceSerializationRejected(rejected.message)),
          onComplete: async serialized => {
            const mergedManifest: Record<string, unknown> = { ...serialized.manifest };
            try {
              if (await fs.pathExists(outputPath)) {
                const existing: unknown = await fs.readJson(outputPath);
                if (existing !== null && typeof existing === 'object') {
                  if ('frontend' in existing) mergedManifest.frontend = existing.frontend;
                  if ('pages' in existing) mergedManifest.pages = existing.pages;
                }
              }
            } catch {
              // Optional prior frontend/page state cannot override the current manifest judgment.
            }

            try {
              await fs.writeJson(outputPath, mergedManifest, { spaces: 2 });
              return persistenceComplete(outputPath);
            } catch (error: unknown) {
              return persistenceWriteRejected(
                outputPath,
                error instanceof Error ? error.message : String(error),
              );
            }
          },
        });
      },
    });
  },
});

export const manifestGeneratorOperations: ManifestGeneratorOperationsInterface = Object.freeze({
  generate: manifestRuntimeGenerationOperation.generate,
  fromOptions: manifestGenerationFromOptionsOperation.generate,
  save: manifestRuntimePersistenceOperation.save,
});

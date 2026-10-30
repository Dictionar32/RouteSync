import { existsSync } from 'node:fs';
import type { RouteSemanticFlow } from '../domain/routes';
import type { ControllerActionFlowContract } from './highLevelContracts';
import type { SourceFile } from './names';
import type { ControllerActionJudgmentPublication } from './laravelControllerScannerInterface';
import {
  laravelRouteScanOutcomeOperations,
  type LaravelRouteScannerAuthorityInterface,
  type LaravelRouteScannerInterface,
  type LaravelRouteScanInput,
  type LaravelRouteScanOperationInterface,
  type LaravelRouteScanJudgment,
  type LaravelRouteSourceFileObservation,
} from './laravelRouteScannerInterface';
import { laravelRouteSourcePresenceJudgmentFactory, type LaravelRouteSourcePresenceInterface } from './laravelRouteSourceSelection';
import type { PhpSourceDocumentReadBatchJudgment } from './phpSourceFrontendInterface';
import { operationIdentityCapabilityAuthorityOperations } from './operationIdentityCapabilityAuthority';
import { createMiddlewareName } from './names';
import { laravelDefaultRouteSourceResolution } from './laravelDefaultRouteSourceResolution';

/** Construction contract for the existing route scanner; all semantic owners are injected explicitly. */
export interface LaravelRouteScannerFactoryInterface {
  readonly kind: 'laravel_route_scanner_factory';
  readonly create: (authorities: LaravelRouteScannerAuthorityInterface) => LaravelRouteScannerInterface;
}

const controllerActions = (input: LaravelRouteScanInput): readonly ControllerActionFlowContract[] =>
  Object.freeze(input.controllerScan.controllers.flatMap(controller => controller.actions));

const actionPublications = (input: LaravelRouteScanInput): readonly ControllerActionJudgmentPublication[] =>
  Object.freeze(input.controllerScan.controllers.flatMap(controller => controller.actionJudgments));

const flowFromBoundary = (
  boundary: import('./route').RouteBoundaryContract,
  controllerActionPolicy: import('./presence').Presence<import('./effectiveControllerActionPolicy').EffectiveControllerActionPolicy>,
): RouteSemanticFlow => Object.freeze({
  authorization: boundary.authorization,
  controllerActionPolicy,
  identity: boundary.identity,
  binding: boundary.binding,
  capability: boundary.capability,
  operationIdentityCapability: operationIdentityCapabilityAuthorityOperations.materialize({
    identity: boundary.capability.identity,
    evidence: boundary.capability.evidence,
    derivation: boundary.capability.derivation,
    provenance: boundary.capability.provenance,
    reasoning: boundary.capability.reasoning,
    closed: boundary.capability.closed,
  }),
  provenance: boundary.provenance,
  contract: boundary.contract,
});

const executePreparedScan = async (
  input: LaravelRouteScanInput,
  authorities: LaravelRouteScannerAuthorityInterface,
): Promise<import('./laravelRouteScannerInterface').LaravelRouteScanOutcome> => {
  const sourceProject = input.controllerScan.sourceProject;
  const selectedFiles = input.sourceSelectionIntent.resolveFilesFor(sourceProject, laravelDefaultRouteSourceResolution);
  const sourcePresence: LaravelRouteSourcePresenceInterface = Object.freeze({
    kind: 'laravel_route_source_presence',
    observe: (sourceFile: SourceFile) => existsSync(sourceFile.value.value)
      ? laravelRouteSourcePresenceJudgmentFactory.present(sourceFile)
      : laravelRouteSourcePresenceJudgmentFactory.absent(sourceFile),
  });
  // Selection intent owns the source-presence decision and continuation. The
  // scanner invokes that domain operation directly; composition only resolves
  // the project-specific default inventory.
  const observation = input.sourceSelectionIntent.observeFiles(selectedFiles, sourcePresence);

  return observation.continueToRouteScan(authorities.sourceDocumentReader, {
    scanReadyObservation: async (ready, readBatch: PhpSourceDocumentReadBatchJudgment) => {
      const sourceFiles: readonly LaravelRouteSourceFileObservation[] = ready.sourceFiles;
      return readBatch.continueToRouteScan({
      blocked: async blocked => {
        return laravelRouteScanOutcomeOperations.sourceReadBlocked(Object.freeze({
          kind: 'laravel_route_scan_source_read_blocked',
          contractVersion: 28,
          sourceFiles,
          readBatch: blocked,
        }));
      },
      complete: async _complete => {
        // Declaration evidence is already a closed source-grounded ADT at this
        // boundary. The scanner executes its domain composition; it does not
        // tokenize or reinterpret PHP in this operation.
        const publications = actionPublications(input);
        const declarations = input.declarations.flatMap(declarationEvidence => {
          const methodJudgment = authorities.declarationMethodAuthority.judge({
            method: declarationEvidence.method,
            targetMethods: declarationEvidence.targetMethods,
          });
          const boundaries = authorities.declarationCompositionAuthority.compose({
            declarationEvidence,
            methodJudgment,
            authorizationAuthority: authorities.authorizationAuthority,
            routeResourceFlowAuthority: authorities.routeResourceFlowAuthority,
            routePathResolutionAuthority: authorities.routePathResolutionAuthority,
            sourceFile: declarationEvidence.span.file,
            controllerScan: input.controllerScan,
            publications,
            controllerActionRouteCorrelationAuthority: authorities.controllerActionRouteCorrelationAuthority,
          });
          return boundaries.map(boundary => Object.freeze({ boundary, declarationEvidence, methodJudgment }));
        });
        const policyCatalog = authorities.declarationCompositionAuthority.catalogFromControllerScan(input.controllerScan);
        const artifacts = declarations.map(({ boundary, declarationEvidence, methodJudgment }) => {
          const producerInput = authorities.routeProducerInputComposition.compose({
            boundary,
            declaration: declarationEvidence,
            source: declarationEvidence.span,
            methodJudgment,
          });
          const ast = authorities.routeProducer.produce(producerInput);
          const binding = authorities.bindingAuthority.judge({
            kind: 'route_controller_binding_judgment_input',
            route: ast,
            controllerActions: controllerActions(input),
          });
          const controllerActionPolicy = authorities.declarationCompositionAuthority.policyForBinding({
            routeMiddleware: Object.freeze([...declarationEvidence.middleware, ...declarationEvidence.routeMiddleware].map(createMiddlewareName)),
            declarationEvidence,
            binding,
            controllerPolicyCatalog: policyCatalog,
            effectiveControllerActionPolicyAuthority: authorities.effectiveControllerActionPolicyAuthority,
          });
          return Object.freeze({
            kind: 'laravel_route_scan_artifact' as const,
            ast,
            flow: flowFromBoundary(boundary, controllerActionPolicy),
            binding,
            authorization: boundary.authorization,
          });
        });
        const scan: LaravelRouteScanJudgment = Object.freeze({
          kind: 'laravel_route_scan_judgment',
          contractVersion: 27,
          sourceFiles,
          artifacts: Object.freeze(artifacts),
        });
        return authorities.declarationCompositionAuthority.outcomeFromScan(scan);
      },
      });
    },
  });
};

export const laravelRouteScannerFactory: LaravelRouteScannerFactoryInterface = Object.freeze({
  kind: 'laravel_route_scanner_factory',
  create: (authorities: LaravelRouteScannerAuthorityInterface): LaravelRouteScannerInterface => Object.freeze({
    kind: 'laravel_route_scanner',
    closed: true,
    contractVersion: 40,
    ...authorities,
    prepare: async (input: LaravelRouteScanInput): Promise<LaravelRouteScanOperationInterface> => Object.freeze({
        kind: 'prepared_laravel_route_scan_operation',
        closed: true,
        contractVersion: 4,
        ...authorities,
        input,
        // Preparation closes over the request and authority set only. Source
        // discovery, reads, and route judgment production belong to execute().
        execute: async () => executePreparedScan(input, authorities),
      }),
  }),
});

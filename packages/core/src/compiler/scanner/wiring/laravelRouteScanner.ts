import fs from 'node:fs';
import { routeAuthorizationSemanticJudgmentAuthority } from '../semantic/route/routeMiddlewareKnowledgeCatalog';
import { routeControllerBindingAuthority } from '../../semantic/routeControllerBindingAuthority';
import type { RouteAst } from '../../../types/upstream/ast';
import type { RouteBoundaryContract } from '../../../types/upstream/route';
import type { LaravelRouteScannerInterface, LaravelRouteSourceFileObservation } from '../../../types/upstream/laravelRouteScannerInterface';
import { laravelRouteDeclarationMethodSemanticAuthority } from '../../../types/upstream/laravelRouteDeclarationMethodSemanticAuthority';
import { createMiddlewareName, createSourceFile } from '../../../types/upstream/names';
import { LaravelSourceLexer } from '../LaravelSourceLexer';
import { routeDeclarationCompositionAuthority, routeProducerInputComposition, routeSemanticFlowProjection, routeDeclarationEvidenceProjection } from '../upstream/routeDeclarationComposition';
import { controllerReturnSemanticProductionAuthority } from '../../semantic/controllerReturnSemanticProductionAuthority';
import { routeProducer } from '../../../types/upstream/routeProducer';
import { routeResourceFlowAuthority } from '../../../types/upstream/routeResourceFlow';
import { laravelRoutePathResolutionAuthority } from '../../../types/upstream/routePathResolutionAuthority';
import type { ControllerActionFlowContract } from '../../../types/upstream/highLevelContracts';
import type { ControllerActionJudgmentPublication } from '../../../types/upstream/laravelControllerScannerInterface';
import { controllerActionRouteCorrelationAuthority } from '../../../types/upstream/laravelControllerActionRouteCorrelationAuthority';
import { effectiveControllerActionPolicySemanticAuthority } from '../../../types/upstream/effectiveControllerActionPolicyResolver';

type LaravelRouteScannerAuthorities = Pick<
  LaravelRouteScannerInterface,
  'bindingAuthority' | 'declarationMethodAuthority' | 'authorizationAuthority' | 'effectiveControllerActionPolicyAuthority' | 'routeResourceFlowAuthority' | 'routePathResolutionAuthority' | 'controllerActionRouteCorrelationAuthority' | 'routeProducerInputComposition' | 'routeProducer' | 'declarationCompositionAuthority'
>;

/** Factory contract for constructing the route scanner from explicit authorities. */
export interface LaravelRouteScannerFactoryInterface {
  readonly create: (authorities: LaravelRouteScannerAuthorities) => LaravelRouteScannerInterface;
}

/**
 * Prepare one immutable route-scan operation. Runtime execution reads its explicit input and
 * authorities from the operation contract and accepts no positional or object arguments.
 */
export const laravelRouteScannerFactory: LaravelRouteScannerFactoryInterface = Object.freeze({
  create: (authorities: LaravelRouteScannerAuthorities): LaravelRouteScannerInterface => Object.freeze({
    kind: 'laravel_route_scanner',
    closed: true,
    contractVersion: 36,
    ...authorities,
    async prepare(input: import('../../../types/upstream/laravelRouteScannerInterface').LaravelRouteScanInput) {
      const { controllerScan, sourceSelectionIntent } = input;
      const sourceProject = controllerScan.sourceProject;
      const actions: readonly ControllerActionFlowContract[] = Object.freeze(controllerScan.controllers.flatMap(controller => controller.actions));
      const actionJudgments: readonly ControllerActionJudgmentPublication[] = Object.freeze(controllerScan.controllers.flatMap(controller => controller.actionJudgments));
      const selectedFiles = authorities.declarationCompositionAuthority.resolveSourceFiles(sourceProject, sourceSelectionIntent);
      const missingFiles = Object.freeze(selectedFiles.filter(file => !fs.existsSync(file.value.value)));
      const sourceObservation = authorities.declarationCompositionAuthority.observeSourceFiles({ intent: sourceSelectionIntent, selectedFiles, missingFiles });
      let outcome: import('../../../types/upstream/laravelRouteScannerInterface').LaravelRouteScanOutcome;
      if (sourceObservation.kind === 'laravel_route_scan_blocked') {
        outcome = sourceObservation;
      } else {
        const sourceFiles: readonly LaravelRouteSourceFileObservation[] = sourceObservation.sourceFiles;
        const origins = Object.freeze((await Promise.all(selectedFiles.map(async selectedFile => {
          const file = selectedFile.value.value;
          if (!fs.existsSync(file)) return Object.freeze([]);
          const source = await fs.promises.readFile(file, 'utf-8');
          const declarations = LaravelSourceLexer.parseRouteDeclarations(LaravelSourceLexer.tokenize(source));
          return Object.freeze(declarations.flatMap(declaration => {
            const evidence = routeDeclarationEvidenceProjection.fromAst(declaration, file, controllerReturnSemanticProductionAuthority);
            const methodJudgment = authorities.declarationMethodAuthority.judge({ method: evidence.method, targetMethods: evidence.targetMethods });
            return authorities.declarationCompositionAuthority.compose({
              declarationEvidence: evidence,
              methodJudgment,
              authorizationAuthority: authorities.authorizationAuthority,
              routeResourceFlowAuthority: authorities.routeResourceFlowAuthority,
              routePathResolutionAuthority: authorities.routePathResolutionAuthority,
              sourceFile: createSourceFile(file),
              controllerScan,
              publications: actionJudgments,
              controllerActionRouteCorrelationAuthority: authorities.controllerActionRouteCorrelationAuthority,
            }).map(boundary => Object.freeze({ boundary, evidence, methodJudgment }));
          }));
        }))).flat());
        const controllerPolicyCatalog = authorities.declarationCompositionAuthority.catalogFromControllerScan(controllerScan);
        const artifacts = origins.map(({ boundary, evidence, methodJudgment }) => {
          const producerInput = authorities.routeProducerInputComposition.compose({ boundary, declaration: evidence, source: evidence.span, methodJudgment });
          const ast: RouteAst = authorities.routeProducer.produce(producerInput);
          const binding = authorities.bindingAuthority.judge({ kind: 'route_controller_binding_judgment_input', route: ast, controllerActions: actions });
          const routeMiddleware = Object.freeze([...evidence.middleware, ...evidence.routeMiddleware].map(createMiddlewareName));
          const controllerActionPolicy = authorities.declarationCompositionAuthority.policyForBinding({
            routeMiddleware,
            declarationEvidence: evidence,
            binding,
            controllerPolicyCatalog,
            effectiveControllerActionPolicyAuthority: authorities.effectiveControllerActionPolicyAuthority,
          });
          const flow = routeSemanticFlowProjection.project(boundary, controllerActionPolicy);
          return Object.freeze({ kind: 'laravel_route_scan_artifact' as const, ast, flow, binding, authorization: boundary.authorization });
        });
        const scan: import('../../../types/upstream/laravelRouteScannerInterface').LaravelRouteScanJudgment = Object.freeze({
          kind: 'laravel_route_scan_judgment',
          contractVersion: 27,
          sourceFiles,
          artifacts: Object.freeze(artifacts),
        });
        outcome = authorities.declarationCompositionAuthority.outcomeFromScan(scan);
      }
      return Object.freeze({
        kind: 'prepared_laravel_route_scan_operation' as const,
        closed: true as const,
        contractVersion: 2 as const,
        ...authorities,
        input,
        async execute() {
          return outcome;
        },
      });
    },
  }),
});

export const laravelRouteScanner: LaravelRouteScannerInterface = laravelRouteScannerFactory.create({
  bindingAuthority: routeControllerBindingAuthority,
  declarationMethodAuthority: laravelRouteDeclarationMethodSemanticAuthority,
  effectiveControllerActionPolicyAuthority: effectiveControllerActionPolicySemanticAuthority,
  authorizationAuthority: routeAuthorizationSemanticJudgmentAuthority,
  routeResourceFlowAuthority,
  routePathResolutionAuthority: laravelRoutePathResolutionAuthority,
  controllerActionRouteCorrelationAuthority,
  routeProducerInputComposition,
  routeProducer,
  declarationCompositionAuthority: routeDeclarationCompositionAuthority,
});


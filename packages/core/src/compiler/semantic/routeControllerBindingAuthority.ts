import type { RouteAst } from '../../types/upstream/ast';
import type { ControllerActionFlowContract } from '../../types/upstream/highLevelContracts';
import type {
  RouteControllerBindingCandidate,
  RouteControllerBindingJudgment,
  RouteControllerBindingJudgmentAuthority,
  RouteControllerBindingJudgmentInput,
  RouteControllerBindingSourceEvidence,
} from '../../types/upstream/laravelScannerSemanticJudgment';

const sourceEvidence = (route: RouteAst): RouteControllerBindingSourceEvidence => Object.freeze({
  kind: 'route_controller_binding_source_evidence',
  route: route.semantic.definition.identity,
  source: route.semantic.definition.provenance.span,
  targetForm: route.semantic.definition.bindings.target.kind === 'controller_action' || route.semantic.definition.bindings.target.kind === 'controller_invokable'
    ? 'static_controller_action'
    : 'dynamic_or_unproven',
});

const candidateFor = (
  route: RouteAst,
  action: ControllerActionFlowContract,
): RouteControllerBindingCandidate => Object.freeze({
  action,
  evidence: Object.freeze({
    kind: 'route_controller_binding_candidate_evidence',
    route: route.semantic.definition.identity,
    source: route.semantic.definition.provenance.span,
    targetForm: 'static_controller_action',
  }),
});

const judgeRouteControllerBinding = (input: RouteControllerBindingJudgmentInput): RouteControllerBindingJudgment => {
  const route = input.route;
  const target = route.semantic.definition.bindings.target;
  const evidence = sourceEvidence(route);
  const routeIdentity = route.semantic.definition.identity;
  const targetReference = target.kind === 'controller_action' || target.kind === 'controller_invokable' ? target.controller : undefined;
  const candidates = targetReference === undefined
    ? Object.freeze([])
    : Object.freeze(input.controllerActions.filter(action =>
      action.controller.value.value === targetReference.name.value.value
      && action.action.value.value === targetReference.action.value.value,
    ).map(action => candidateFor(route, action)));

  const outcome = targetReference === undefined
    ? { kind: 'unresolved' as const, reason: 'route_target_not_static' as const, evidence: Object.freeze([evidence] as const) }
    : candidates.length === 0
      ? { kind: 'unresolved' as const, reason: 'no_controller_action_candidate' as const, evidence: Object.freeze([evidence] as const) }
      : candidates.length === 1
        ? { kind: 'resolved' as const, candidate: candidates[0] }
        : { kind: 'ambiguous' as const, candidates: Object.freeze(candidates) as readonly [RouteControllerBindingCandidate, RouteControllerBindingCandidate, ...RouteControllerBindingCandidate[]] };

  return Object.freeze({ kind: 'route_controller_binding_judgment', route: routeIdentity, outcome });
};

export const routeControllerBindingAuthority: RouteControllerBindingJudgmentAuthority = Object.freeze({
  kind: 'route_controller_binding_judgment_authority',
  closed: true,
  judge: judgeRouteControllerBinding,
});

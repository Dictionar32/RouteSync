/**
 * Closed, interface-first route-domain authority.
 *
 * This module owns route-domain evidence and resolution operations. It does not
 * depend on the removed semantic/relations utility modules.
 */
import { toCamelCase, toPascalCase, ResourceNamingConvention } from '../../utils/resource-naming';
import { SemanticValueFactory } from '../domain/semanticValues';
import type { ActionName, ControllerName, DomainTypeName, ResourceName, RoutePath } from './names';

export type RouteDomainDomainEvidence =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'some'; readonly value: DomainTypeName }>;
export type RouteDomainResourceEvidence =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'some'; readonly value: ResourceName }>;
export type RouteDomainControllerEvidence =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'some'; readonly value: ControllerName }>;
export type RouteDomainPathEvidence =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'some'; readonly value: RoutePath }>;
export type RouteDomainActionEvidence =
  | Readonly<{ readonly kind: 'none' }>
  | Readonly<{ readonly kind: 'some'; readonly value: ActionName }>;

export interface RouteDomainResolutionContext {
  readonly domain: RouteDomainDomainEvidence;
  readonly resourceName: RouteDomainResourceEvidence;
  readonly controllerName: RouteDomainControllerEvidence;
  readonly path: RouteDomainPathEvidence;
  readonly actionName: RouteDomainActionEvidence;
}

export type RouteDomainResolutionOutcome = 'candidate_selected' | 'default_applied';

export interface RouteDomainResolutionContinuationHandlersInterface {
  readonly candidate_selected: (judgment: RouteDomainResolutionJudgment) => void;
  readonly default_applied: (judgment: RouteDomainResolutionJudgment) => void;
}

export interface RouteDomainCandidateSelectedSelection {
  readonly kind: 'candidate_selected';
  readonly candidate: RouteDomainCandidate;
  readonly result: DomainTypeName;
  readonly continueWith: (handlers: RouteDomainCandidateSelectionContinuationHandlersInterface) => void;
}

export interface RouteDomainDefaultAppliedSelection {
  readonly kind: 'default_applied';
  readonly result: DomainTypeName;
  readonly continueWith: (handlers: RouteDomainCandidateSelectionContinuationHandlersInterface) => void;
}

export type RouteDomainCandidateSelection = RouteDomainCandidateSelectedSelection | RouteDomainDefaultAppliedSelection;

export interface RouteDomainCandidateSelectionContinuationHandlersInterface {
  readonly candidate_selected: (selection: RouteDomainCandidateSelectedSelection) => void;
  readonly default_applied: (selection: RouteDomainDefaultAppliedSelection) => void;
}

export interface RouteDomainResolutionJudgment {
  readonly kind: 'route_domain_resolution_judgment';
  readonly input: RouteDomainResolutionContext;
  readonly candidates: readonly RouteDomainCandidate[];
  readonly selected: RouteDomainCandidateSelection;
  readonly result: DomainTypeName;
  readonly outcome: RouteDomainResolutionOutcome;
  readonly rule: 'explicit>controller>resource>register>path>action>default';
  readonly resolution: 'ranked_domain_candidates';
  readonly authority: 'upstream';
  readonly closed: true;
  readonly continueWith: (handlers: RouteDomainResolutionContinuationHandlersInterface) => void;
}

export type RouteDomainCandidateKind =
  | 'explicit_domain'
  | 'controller_domain'
  | 'resource_domain'
  | 'register_domain'
  | 'path_domain'
  | 'action_domain';

export interface RouteDomainCandidate {
  readonly kind: 'route_domain_candidate';
  readonly source: RouteDomainCandidateKind;
  readonly domain: DomainTypeName;
}

const selectedCandidate = (candidate: RouteDomainCandidate): RouteDomainCandidateSelection => {
  let selection: RouteDomainCandidateSelectedSelection;
  selection = Object.freeze({
    kind: 'candidate_selected',
    candidate,
    result: candidate.domain,
    continueWith: handlers => handlers.candidate_selected(selection),
  });
  return selection;
};

const defaultSelection = (): RouteDomainCandidateSelection => {
  let selection: RouteDomainDefaultAppliedSelection;
  selection = Object.freeze({
    kind: 'default_applied',
    result: SemanticValueFactory.domainName('App'),
    continueWith: handlers => handlers.default_applied(selection),
  });
  return selection;
};

const domainEvidenceCandidates = (evidence: RouteDomainDomainEvidence): readonly RouteDomainCandidate[] => {
  switch (evidence.kind) {
    case 'some': return Object.freeze([{ kind: 'route_domain_candidate', source: 'explicit_domain', domain: evidence.value }]);
    case 'none': return Object.freeze([]);
  }
};

const controllerEvidenceCandidates = (evidence: RouteDomainControllerEvidence): readonly RouteDomainCandidate[] => {
  switch (evidence.kind) {
    case 'some': return Object.freeze([{
      kind: 'route_domain_candidate',
      source: 'controller_domain',
      domain: SemanticValueFactory.domainName(evidence.value.value.value.replace(/Controller$/, '')),
    }]);
    case 'none': return Object.freeze([]);
  }
};

const resourceEvidenceCandidates = (evidence: RouteDomainResourceEvidence): readonly RouteDomainCandidate[] => {
  switch (evidence.kind) {
    case 'some': return Object.freeze([{
      kind: 'route_domain_candidate',
      source: 'resource_domain',
      domain: SemanticValueFactory.domainName(ResourceNamingConvention.stripSuffix(evidence.value.value.value)),
    }]);
    case 'none': return Object.freeze([]);
  }
};

const routeSegments = (path: RoutePath): readonly string[] =>
  path.value.value
    .split('/')
    .filter(segment => segment.length > 0)
    .filter(segment => !/^api$/i.test(segment))
    .filter(segment => !/^v\d+$/i.test(segment))
    .filter(segment => !segment.startsWith('{'))
    .filter(segment => !segment.startsWith(':'));

const domainFromSegments = (segments: readonly string[]): DomainTypeName =>
  SemanticValueFactory.domainName(segments.map((segment, index) => Object.is(index, 0)
    ? toCamelCase(segment)
    : toPascalCase(toCamelCase(segment))).join('') || 'App');

const pathEvidenceCandidates = (evidence: RouteDomainPathEvidence): readonly RouteDomainCandidate[] => {
  switch (evidence.kind) {
    case 'some': return Object.freeze([{
      kind: 'route_domain_candidate',
      source: 'path_domain',
      domain: domainFromSegments(routeSegments(evidence.value)),
    }]);
    case 'none': return Object.freeze([]);
  }
};

const actionDomain = (action: ActionName): DomainTypeName =>
  SemanticValueFactory.domainName(action.value.value.match(/^(.*)Controller$/)?.[1] || 'App');

const actionEvidenceCandidates = (evidence: RouteDomainActionEvidence): readonly RouteDomainCandidate[] => {
  switch (evidence.kind) {
    case 'some': return Object.freeze([{
      kind: 'route_domain_candidate',
      source: 'action_domain',
      domain: actionDomain(evidence.value),
    }]);
    case 'none': return Object.freeze([]);
  }
};

export interface RouteRegisterEvidenceContinuationHandlersInterface {
  readonly path_register: (evidence: RouteRegisterPathEvidence) => readonly RouteDomainCandidate[];
  readonly action_register: (evidence: RouteRegisterActionEvidence) => readonly RouteDomainCandidate[];
  readonly no_register: (evidence: RouteRegisterAbsentEvidence) => readonly RouteDomainCandidate[];
}

export interface RouteRegisterPathEvidence {
  readonly kind: 'path_register';
  readonly path: RoutePath;
  readonly continueWith: (handlers: RouteRegisterEvidenceContinuationHandlersInterface) => readonly RouteDomainCandidate[];
}

export interface RouteRegisterActionEvidence {
  readonly kind: 'action_register';
  readonly action: ActionName;
  readonly continueWith: (handlers: RouteRegisterEvidenceContinuationHandlersInterface) => readonly RouteDomainCandidate[];
}

export interface RouteRegisterAbsentEvidence {
  readonly kind: 'no_register';
  readonly continueWith: (handlers: RouteRegisterEvidenceContinuationHandlersInterface) => readonly RouteDomainCandidate[];
}

export type RouteRegisterEvidence = RouteRegisterPathEvidence | RouteRegisterActionEvidence | RouteRegisterAbsentEvidence;

export interface RouteRegisterEvidenceAuthorityInterface {
  readonly classify: (path: RouteDomainPathEvidence, action: RouteDomainActionEvidence) => RouteRegisterEvidence;
  readonly authority: 'upstream';
  readonly closed: true;
}

const registerDomainCandidate = (): readonly RouteDomainCandidate[] => Object.freeze([{
  kind: 'route_domain_candidate',
  source: 'register_domain',
  domain: SemanticValueFactory.domainName('Register'),
}]);

const routeRegisterPathEvidence = (path: RoutePath): RouteRegisterPathEvidence => {
  let evidence: RouteRegisterPathEvidence;
  evidence = Object.freeze({
    kind: 'path_register',
    path,
    continueWith: handlers => handlers.path_register(evidence),
  });
  return evidence;
};

const routeRegisterActionEvidence = (action: ActionName): RouteRegisterActionEvidence => {
  let evidence: RouteRegisterActionEvidence;
  evidence = Object.freeze({
    kind: 'action_register',
    action,
    continueWith: handlers => handlers.action_register(evidence),
  });
  return evidence;
};

const routeRegisterAbsentEvidence = (): RouteRegisterAbsentEvidence => {
  let evidence: RouteRegisterAbsentEvidence;
  evidence = Object.freeze({
    kind: 'no_register',
    continueWith: handlers => handlers.no_register(evidence),
  });
  return evidence;
};

const classifyRouteRegisterEvidenceImplementation = (
  path: RouteDomainPathEvidence,
  action: RouteDomainActionEvidence,
): RouteRegisterEvidence => {
  const pathEvidence = (() => {
    switch (path.kind) {
      case 'some': return { kind: 'present' as const, match: /^\/register$/.exec(path.value.value.value), path: path.value };
      case 'none': return { kind: 'absent' as const };
    }
  })();
  switch (pathEvidence.kind) {
    case 'present':
      switch (pathEvidence.match) {
        case null: break;
        default: return routeRegisterPathEvidence(pathEvidence.path);
      }
      break;
    case 'absent': break;
  }
  const actionEvidence = (() => {
    switch (action.kind) {
      case 'some': return { kind: 'present' as const, match: /register$/.exec(action.value.value.value), action: action.value };
      case 'none': return { kind: 'absent' as const };
    }
  })();
  switch (actionEvidence.kind) {
    case 'present':
      switch (actionEvidence.match) {
        case null: return routeRegisterAbsentEvidence();
        default: return routeRegisterActionEvidence(actionEvidence.action);
      }
    case 'absent': return routeRegisterAbsentEvidence();
  }
};

export const routeRegisterEvidenceAuthority: RouteRegisterEvidenceAuthorityInterface = Object.freeze({
  classify: classifyRouteRegisterEvidenceImplementation,
  authority: 'upstream',
  closed: true,
});

const registerEvidenceCandidates = (
  path: RouteDomainPathEvidence,
  action: RouteDomainActionEvidence,
): readonly RouteDomainCandidate[] => routeRegisterEvidenceAuthority.classify(path, action).continueWith({
  path_register: () => registerDomainCandidate(),
  action_register: () => registerDomainCandidate(),
  no_register: () => Object.freeze([]),
});

const resolveRouteDomainJudgmentImplementation = (context: RouteDomainResolutionContext): RouteDomainResolutionJudgment => {
  const candidates = Object.freeze([
    ...domainEvidenceCandidates(context.domain),
    ...controllerEvidenceCandidates(context.controllerName),
    ...resourceEvidenceCandidates(context.resourceName),
    ...registerEvidenceCandidates(context.path, context.actionName),
    ...pathEvidenceCandidates(context.path),
    ...actionEvidenceCandidates(context.actionName),
  ]);
  const candidate = candidates.find(entry => entry.domain.value.value.length > 0);
  const selected = (() => {
    switch (candidate) {
      case undefined: return defaultSelection();
      default: return selectedCandidate(candidate);
    }
  })();
  const result = selected.result;
  const outcome: RouteDomainResolutionOutcome = selected.kind;
  let judgment: RouteDomainResolutionJudgment;
  judgment = Object.freeze({
    kind: 'route_domain_resolution_judgment',
    input: context,
    candidates,
    selected,
    result,
    outcome,
    rule: 'explicit>controller>resource>register>path>action>default',
    resolution: 'ranked_domain_candidates',
    authority: 'upstream',
    closed: true,
    continueWith: handlers => handlers[outcome](judgment),
  });
  return judgment;
};

const resolveRouteDomainImplementation = (context: RouteDomainResolutionContext): DomainTypeName =>
  resolveRouteDomainJudgmentImplementation(context).result;

export interface RouteDomainAuthorityInterface {
  readonly resolve: (context: RouteDomainResolutionContext) => DomainTypeName;
  readonly resolveJudgment: (context: RouteDomainResolutionContext) => RouteDomainResolutionJudgment;
  readonly authority: 'upstream';
  readonly closed: true;
}

export const routeDomainAuthority: RouteDomainAuthorityInterface = Object.freeze({
  resolve: resolveRouteDomainImplementation,
  resolveJudgment: resolveRouteDomainJudgmentImplementation,
  authority: 'upstream' as const,
  closed: true as const,
});

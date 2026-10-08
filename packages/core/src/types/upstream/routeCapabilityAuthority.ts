/**
 * Canonical upstream route capability authority.
 *
 * CRUD meaning is derived here from typed route/action evidence. This module is
 * the semantic authority; resolver/CLI code must only consume its result.
 */
import type { ActionName, RoutePath } from './names';
import type { CrudRole, HttpMethod } from './routeExecutionVocabulary';
import { CrudRole as CrudRoleValue } from './routeExecutionVocabulary';
import { RESOURCE_ACTION_KNOWLEDGE } from './routeResourceFlow';
import { relationAll, relationEqual, relationResolve } from '../../semantic/foundation/semanticRelations';
import { relationFirstOption, relationOptionFold, relationSelect } from '../../semantic/foundation/relationalSequence';
import { relationNone, relationSome, type RelationOption } from '../../semantic/foundation/relationalSequence';
import type { RouteCapabilityCrudEvidence } from './route';

export interface RouteCrudRoleResolution {
  readonly kind: 'route_crud_role_resolution';
  readonly role: CrudRole;
  readonly evidence: RouteCapabilityCrudEvidence;
  readonly closed: true;
}

const actionRole = (action: ActionName): CrudRole => {
  const known = relationFirstOption(RESOURCE_ACTION_KNOWLEDGE, entry => relationEqual(entry.action, action.value.value));
  return relationOptionFold(known, () => CrudRoleValue.Custom, entry =>
    relationResolve(relationEqual(entry.action, 'index'), () => CrudRoleValue.Index, () =>
      relationResolve(relationEqual(entry.action, 'create'), () => CrudRoleValue.Create, () =>
        relationResolve(relationEqual(entry.action, 'store'), () => CrudRoleValue.Create, () =>
          relationResolve(relationEqual(entry.action, 'show'), () => CrudRoleValue.Show, () =>
            relationResolve(relationEqual(entry.action, 'edit'), () => CrudRoleValue.Show, () =>
              relationResolve(relationEqual(entry.action, 'update'), () => CrudRoleValue.Update, () =>
                relationResolve(relationEqual(entry.action, 'destroy'), () => CrudRoleValue.Delete, () => CrudRoleValue.Custom))))))));
};

const pathSegments = (path: RoutePath): readonly string[] =>
  relationSelect(path.value.value.replace(/^\/+|\/+$/g, '').split('/'), segment => segment.length > 0);

const parameterSegments = (path: RoutePath): readonly string[] =>
  relationSelect(pathSegments(path), segment => segment.startsWith('{') || segment.startsWith(':'));

const routeShapeCandidate = (
  method: HttpMethod,
  count: number,
  expectedMethod: HttpMethod,
  expectedCount: number,
  role: CrudRole,
): RelationOption<CrudRole> => relationResolve(
  relationAll([relationEqual(method, expectedMethod), relationEqual(count, expectedCount)]),
  () => relationSome(role),
  () => relationNone(),
);

const routeRole = (method: HttpMethod, path: RoutePath): CrudRole => {
  const count = parameterSegments(path).length;
  const candidates: readonly RelationOption<CrudRole>[] = [
    routeShapeCandidate(method, count, 'GET', 1, CrudRoleValue.Show),
    routeShapeCandidate(method, count, 'GET', 0, CrudRoleValue.Index),
    routeShapeCandidate(method, count, 'POST', 0, CrudRoleValue.Create),
    routeShapeCandidate(method, count, 'PUT', 1, CrudRoleValue.Update),
    routeShapeCandidate(method, count, 'PATCH', 1, CrudRoleValue.Update),
    routeShapeCandidate(method, count, 'DELETE', 1, CrudRoleValue.Delete),
  ];
  return relationOptionFold(
    relationFirstOption(candidates, candidate => candidate.kind === 'some'),
    () => CrudRoleValue.Custom,
    candidate => candidate.value,
  );
};

const routeEvidenceCandidate = (
  method: HttpMethod,
  path: RoutePath,
  role: CrudRole,
): RouteCapabilityCrudEvidence => Object.freeze({
  kind: 'route_capability_crud_evidence' as const,
  source: 'route_shape' as const,
  method,
  path,
  role,
  closed: true as const,
});

const explicitEvidenceCandidate = (explicit: CrudRole): RouteCapabilityCrudEvidence => Object.freeze({
  kind: 'route_capability_crud_evidence' as const,
  source: 'explicit' as const,
  role: explicit,
  closed: true as const,
});

const actionEvidenceCandidate = (action: ActionName, role: CrudRole): RouteCapabilityCrudEvidence => Object.freeze({
  kind: 'route_capability_crud_evidence' as const,
  source: 'resource_action' as const,
  action,
  role,
  closed: true as const,
});


export interface RouteCapabilityAuthorityAlgebraInterface {
  readonly crudRoleFromAction: (action: ActionName) => CrudRole;
  readonly crudRoleFromRoute: (method: HttpMethod, path: RoutePath) => CrudRole;
  readonly crudRoleResolution: (method: HttpMethod, path: RoutePath, action?: ActionName, explicit?: CrudRole) => RouteCrudRoleResolution;
  readonly capabilityEvidence: (role: CrudRole, explicit?: CrudRole, action?: ActionName, method?: HttpMethod, path?: RoutePath) => RouteCapabilityCrudEvidence;
}

export interface RouteCapabilityAuthorityContractInterface extends RouteCapabilityAuthorityAlgebraInterface {
  readonly authority: 'upstream';
  readonly closed: true;
}

export interface RouteCapabilityAuthorityInterface extends RouteCapabilityAuthorityContractInterface {}

export const routeCapabilityAuthority: RouteCapabilityAuthorityInterface = Object.freeze({
  authority: 'upstream' as const,
  closed: true as const,
  crudRoleFromAction: (action: ActionName): CrudRole => actionRole(action),
  crudRoleFromRoute: (method: HttpMethod, path: RoutePath): CrudRole => routeRole(method, path),
  crudRoleResolution: (method: HttpMethod, path: RoutePath, action?: ActionName, explicit?: CrudRole): RouteCrudRoleResolution => {
    const routeRoleResolution = routeRole(method, path);
    const candidates: readonly RelationOption<{ readonly role: CrudRole; readonly evidence: RouteCapabilityCrudEvidence }>[] = [
      explicit === undefined ? relationNone() : relationSome(Object.freeze({ role: explicit, evidence: explicitEvidenceCandidate(explicit) })),
      action === undefined ? relationNone() : relationSome(Object.freeze({ role: actionRole(action), evidence: actionEvidenceCandidate(action, actionRole(action)) })),
      relationSome(Object.freeze({ role: routeRoleResolution, evidence: routeEvidenceCandidate(method, path, routeRoleResolution) })),
    ];
    const selected = relationFirstOption(candidates, candidate => candidate.kind === 'some');
    return relationOptionFold(
      selected,
      () => Object.freeze({
        kind: 'route_crud_role_resolution' as const,
        role: CrudRoleValue.Custom,
        evidence: routeEvidenceCandidate(method, path, CrudRoleValue.Custom),
        closed: true as const,
      }),
      candidate => Object.freeze({ kind: 'route_crud_role_resolution' as const, role: candidate.value.role, evidence: candidate.value.evidence, closed: true as const }),
    );
  },
  capabilityEvidence: (role: CrudRole, explicit?: CrudRole, action?: ActionName, method?: HttpMethod, path?: RoutePath): RouteCapabilityCrudEvidence => {
    const candidates: readonly RelationOption<RouteCapabilityCrudEvidence>[] = [
      explicit === undefined ? relationNone() : relationSome(explicitEvidenceCandidate(explicit)),
      action === undefined ? relationNone() : relationSome(actionEvidenceCandidate(action, role)),
      method === undefined || path === undefined ? relationNone() : relationSome(routeEvidenceCandidate(method, path, role)),
    ];
    return relationOptionFold(
      relationFirstOption(candidates, candidate => candidate.kind === 'some'),
      () => explicitEvidenceCandidate(role),
      candidate => candidate.value,
    );
  },
});


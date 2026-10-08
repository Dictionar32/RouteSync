/**
 * Closed route-domain resolution interface.
 *
 * Domain resolution consumes only explicit relation options. Host-language
 * optionality is eliminated before the resolver boundary; the resolver itself
 * reasons over facts and candidate relations.
 */
import { toCamelCase, toPascalCase, ResourceNamingConvention } from '../../utils/resource-naming';
import { SemanticValueFactory } from '../domain/semanticValues';
import type { ActionName, ControllerName, DomainTypeName, ResourceName, RoutePath } from './names';
import { relationAll, relationAny, relationEqual, relationNotEqual, relationGate } from '../../semantic/foundation/semanticRelations';
import { relationFirstOption, relationOptionFold, relationProject, relationSelect, relationTextTrimChars, relationTextFields, relationTextSlice, relationTextEndsWith, relationTextLower, relationTextNumber, relationTextRemoveSuffix, type RelationOption } from '../../semantic/foundation/relationalSequence';

export interface RouteDomainResolutionContext {
  readonly domain: RelationOption<DomainTypeName>;
  readonly resourceName: RelationOption<ResourceName>;
  readonly controllerName: RelationOption<ControllerName>;
  readonly path: RelationOption<RoutePath>;
  readonly actionName: RelationOption<ActionName>;
}

export interface RouteDomainResolutionJudgment {
  readonly kind: 'route_domain_resolution_judgment';
  readonly input: RouteDomainResolutionContext;
  readonly candidates: readonly RouteDomainCandidate[];
  readonly result: DomainTypeName;
  readonly resolution: 'ranked_relation_candidates';
  readonly closed: true;
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

const candidateFromOption = <T>(
  sourceKind: RouteDomainCandidateKind,
  source: RelationOption<T>,
  present: (value: T) => boolean,
  project: (value: T) => DomainTypeName,
): readonly RouteDomainCandidate[] =>
  relationOptionFold(
    source,
    () => Object.freeze([]),
    value => relationGate(
      present(value),
      () => Object.freeze([{ kind: 'route_domain_candidate' as const, source: sourceKind, domain: project(value) }]),
      () => Object.freeze([]),
    ),
  );

const segmentEvidence = (path: string): readonly string[] =>
  relationSelect(
    relationTextFields(relationTextTrimChars(path, ['/']), '/'),
    segment => relationAll([
      relationNotEqual(segment, ''),
      relationNotEqual(relationTextLower(segment), 'api'),
      relationAny([
        relationNotEqual(relationTextLower(relationTextSlice(segment, 0, 1)), 'v'),
        relationTextNumber(relationTextSlice(segment, 1), -1) < 0,
      ]),
      relationNotEqual(relationTextSlice(segment, 0, 1), '{'),
      relationNotEqual(relationTextSlice(segment, 0, 1), ':'),
    ]),
  );

const domainFromSegments = (segments: readonly string[]): DomainTypeName =>
  relationOptionFold(
    relationFirstOption(segments, () => true),
    () => SemanticValueFactory.domainName('App'),
    () => SemanticValueFactory.domainName(
      relationProject(
        segments,
        (segment, index) => relationGate(
          relationEqual(index, 0),
          () => toCamelCase(segment),
          () => toPascalCase(toCamelCase(segment)),
        ),
      ).join(''),
    ),
  );

const actionDomain = (action: ActionName): DomainTypeName =>
  relationGate(
    relationTextEndsWith(action.value.value, 'Controller'),
    () => SemanticValueFactory.domainName(relationTextRemoveSuffix(action.value.value, 'Controller')),
    () => SemanticValueFactory.domainName('App'),
  );

export const resolveRouteDomainJudgment = (context: RouteDomainResolutionContext): RouteDomainResolutionJudgment => {
  const explicit = candidateFromOption('explicit_domain', context.domain, () => true, value => value);
  const controller = candidateFromOption(
    'controller_domain',
    context.controllerName,
    () => true,
    value => SemanticValueFactory.domainName(relationTextRemoveSuffix(value.value.value, 'Controller')),
  );
  const resource = candidateFromOption(
    'resource_domain',
    context.resourceName,
    () => true,
    value => SemanticValueFactory.domainName(ResourceNamingConvention.stripSuffix(value.value.value)),
  );
  const register = relationOptionFold(
    context.path,
    () => Object.freeze([]),
    path => relationOptionFold(
      context.actionName,
      () => Object.freeze([]),
      action => relationGate(
        relationAny([
          relationEqual(path.value.value, '/register'),
          relationEqual(action.value.value, 'register'),
          relationGate(
            relationTextEndsWith(action.value.value, 'register'),
            () => true,
            () => false,
          ),
        ]),
        () => Object.freeze([{ kind: 'route_domain_candidate' as const, source: 'register_domain' as const, domain: SemanticValueFactory.domainName('Register') }]),
        () => Object.freeze([]),
      ),
    ),
  );
  const path = candidateFromOption('path_domain', context.path, () => true, value => domainFromSegments(segmentEvidence(value.value.value)));
  const action = candidateFromOption('action_domain', context.actionName, () => true, actionDomain);
  const candidates = Object.freeze([...explicit, ...controller, ...resource, ...register, ...path, ...action]);
  const result = relationOptionFold(
    relationFirstOption(candidates, entry => relationNotEqual(entry.domain.value.value, '')),
    () => SemanticValueFactory.domainName('App'),
    entry => entry.domain,
  );
  return Object.freeze({
    kind: 'route_domain_resolution_judgment',
    input: context,
    candidates,
    result,
    resolution: 'ranked_relation_candidates',
    closed: true,
  });
};

export const resolveRouteDomain = (context: RouteDomainResolutionContext): DomainTypeName => resolveRouteDomainJudgment(context).result;
export interface RouteDomainAuthorityInterface {
  readonly resolve: (context: RouteDomainResolutionContext) => DomainTypeName;
  readonly resolveJudgment: (context: RouteDomainResolutionContext) => RouteDomainResolutionJudgment;
  readonly authority: 'upstream';
  readonly closed: true;
}

export const routeDomainAuthority: RouteDomainAuthorityInterface = Object.freeze({
  resolve: resolveRouteDomain,
  resolveJudgment: resolveRouteDomainJudgment,
  authority: 'upstream' as const,
  closed: true as const,
});


/**
 * Declarative route-domain resolution.
 *
 * Domain candidates are facts ordered by rank. Resolution is a relation fold;
 * there is no resolver class, mutable registry, or host branching authority.
 */
import { toCamelCase, toPascalCase, ResourceNamingConvention } from '../../../utils/resource-naming';
import { SemanticValueFactory } from '../../../types/domain/semanticValues';
import type { ActionName, ControllerName, DomainTypeName, ResourceName, RoutePath } from '../../../types/upstream/names';
import { relationAll, relationAny, relationEqual, relationGate } from '../../../semantic/kernel/semanticRelations';
import { relationFirstOption, relationOptionFold, relationProject, relationSelect } from '../../../semantic/kernel/relationalSequence';

export interface RouteDomainResolutionContext {
  readonly domain?: DomainTypeName;
  readonly resourceName?: ResourceName;
  readonly controllerName?: ControllerName;
  readonly path?: RoutePath;
  readonly actionName?: ActionName;
}

type Candidate = readonly [number, DomainTypeName];

const candidateFrom = <T>(
  rank: number,
  source: readonly T[],
  present: (value: T) => boolean,
  project: (value: T) => DomainTypeName,
): readonly Candidate[] =>
  relationOptionFold(
    relationFirstOption(source, present),
    () => Object.freeze([] as Candidate[]),
    value => Object.freeze([[rank, project(value)] as const]),
  );

const segmentEvidence = (path: string): readonly string[] =>
  relationSelect(
    path.replace(/^\/+/, '').split('/'),
    segment => relationAll([
      segment.length > 0,
      !relationEqual(segment, 'api'),
      !/^v\d+$/i.test(segment),
      !segment.startsWith('{'),
      !segment.startsWith(':'),
    ]),
  );

const domainFromSegments = (segments: readonly string[]): DomainTypeName =>
  relationOptionFold(
    relationFirstOption([segments], value => value.length > 0),
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

const actionDomain = (action: ActionName): DomainTypeName => {
  const match = action.value.value.match(/([A-Z][a-zA-Z0-9_]*?)Controller/);
  return relationGate(
    relationAll([Boolean(match), Boolean(match?.[1])]),
    () => SemanticValueFactory.domainName(String(match?.[1])),
    () => SemanticValueFactory.domainName('App'),
  );
};

export const resolveRouteDomain = (context: RouteDomainResolutionContext): DomainTypeName => {
  const explicit = candidateFrom(0, relationGate(Boolean(context.domain), () => [context.domain!], () => []), () => true, value => value);
  const controller = candidateFrom(
    1,
    relationGate(Boolean(context.controllerName), () => [context.controllerName!], () => []),
    () => true,
    value => SemanticValueFactory.domainName(value.value.value.replace(/Controller$/, '')),
  );
  const resource = candidateFrom(
    2,
    relationGate(Boolean(context.resourceName), () => [context.resourceName!], () => []),
    () => true,
    value => SemanticValueFactory.domainName(ResourceNamingConvention.stripSuffix(value.value.value)),
  );
  const register = candidateFrom(
    3,
    relationGate(relationAll([Boolean(context.path), Boolean(context.actionName)]), () => [context.path!], () => []),
    value => relationAny([
      relationEqual(value.value.value, '/register'),
      relationEqual(context.actionName?.value.value, 'register'),
      relationGate(
        Boolean(context.actionName),
        () => Boolean(context.actionName?.value.value.endsWith('register')),
        () => false,
      ),
    ]),
    () => SemanticValueFactory.domainName('Register'),
  );
  const path = candidateFrom(
    4,
    relationGate(Boolean(context.path), () => [context.path!], () => []),
    () => true,
    value => domainFromSegments(segmentEvidence(value.value.value)),
  );
  const action = candidateFrom(
    5,
    relationGate(Boolean(context.actionName), () => [context.actionName!], () => []),
    () => true,
    value => actionDomain(value),
  );
  const candidates = Object.freeze([...explicit, ...controller, ...resource, ...register, ...path, ...action]);
  return relationOptionFold(
    relationFirstOption(candidates, entry => entry[1].value.value.length > 0),
    () => SemanticValueFactory.domainName('App'),
    entry => entry[1],
  );
};

/** Compatibility projection; semantic authority remains resolveRouteDomain. */
export const RouteDomainResolver = Object.freeze({ resolve: resolveRouteDomain });

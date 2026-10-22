import { SemanticValueFactory } from '../domain/semanticValues';
import { createModelName, createPropertyName, createRouteParameterName, createRoutePath, deriveRouteConstantKey } from './names';
import { toCamelCase, toPascalCase } from '../../utils/resource-naming';
import type { LaravelRoutePathResolutionAuthority, LaravelRoutePathResolutionInput, ResolvedLaravelRoutePath } from './routePathResolution';
import type { RouteParameter, RouteParameterBinding, RouteParameterType } from './route';
import type { ModelReference } from './semanticReferences';
import type { Option } from './collections';

const normalizedSegments = (input: LaravelRoutePathResolutionInput): readonly string[] => Object.freeze([
  ...input.groupPrefixes.flatMap(prefix => prefix.split('/').filter(segment => segment.length > 0)),
  ...input.declaredPath.split('/').filter(segment => segment.length > 0),
]);

const normalizedUri = (input: LaravelRoutePathResolutionInput): string => {
  const segments = normalizedSegments(input);
  const uri = `/${segments.join('/')}`;
  return uri.startsWith('/api') ? uri : `/api${uri}`;
};

const modelReference = (name: string): ModelReference => Object.freeze({
  kind: 'model_reference',
  name: createModelName(name),
});

const parameterPresence = (optional: boolean): RouteParameter['presence'] => optional
  ? Object.freeze({ kind: 'optional' })
  : Object.freeze({ kind: 'required' });

const pathParameter = (segment: string): RouteParameter => {
  const separatorIndex = segment.indexOf(':');
  const declaredName = segment.slice(0, separatorIndex < 0 ? segment.length : separatorIndex);
  const bindingField: Option<string> = separatorIndex < 0
    ? Object.freeze({ kind: 'none' })
    : Object.freeze({ kind: 'some', value: segment.slice(separatorIndex + 1) });
  const optional = declaredName.endsWith('?');
  const name = optional ? declaredName.slice(0, -1) : declaredName;
  const model = modelReference(toPascalCase(name));
  const field: Option<ReturnType<typeof createPropertyName>> = bindingField.kind === 'none'
    ? Object.freeze({ kind: 'none' })
    : Object.freeze({ kind: 'some', value: createPropertyName(bindingField.value) });
  const binding: RouteParameterBinding = bindingField.kind === 'none'
    ? Object.freeze({ kind: 'convention' })
    : Object.freeze({
      kind: 'implicit_model',
      model,
      field,
      scoped: Object.freeze({ kind: 'truth_value', value: false }),
      withTrashed: Object.freeze({ kind: 'truth_value', value: false }),
    });
  const type: RouteParameterType = bindingField.kind === 'none'
    ? Object.freeze({ kind: 'string' })
    : Object.freeze({ kind: 'model', model });
  return Object.freeze({
    kind: 'route_parameter',
    name: createRouteParameterName(name),
    propertyName: createPropertyName(toCamelCase(name)),
    binding,
    presence: parameterPresence(optional),
    type,
    constraint: Object.freeze({ kind: 'unconstrained' }),
    modelBinding: Object.freeze({
      kind: 'route_model_binding_options',
      missing: Object.freeze({ kind: 'framework_not_found' }),
      scoped: Object.freeze({ kind: 'truth_value', value: false }),
      withTrashed: Object.freeze({ kind: 'truth_value', value: false }),
    }),
    location: Object.freeze({ kind: 'path' }),
  });
};

const pathParameters = (path: string): readonly RouteParameter[] => Object.freeze(
  [...path.matchAll(/\{([^}]+)\}/g)].map(match => pathParameter(match[0].slice(1, -1))),
);

const resolve = (input: LaravelRoutePathResolutionInput): ResolvedLaravelRoutePath => {
  const uri = normalizedUri(input);
  const resourceSegment = uri.split('/').find(segment => segment.length > 0 && segment !== 'api' && !segment.startsWith('{'));
  const path = createRoutePath(uri);
  return Object.freeze({
    kind: 'resolved_laravel_route_path',
    path,
    resourceName: SemanticValueFactory.resourceName(resourceSegment ?? 'general'),
    parameters: pathParameters(uri),
    runtimePath: createRoutePath(uri.replace(/\{([^}]+)\}/g, ':$1')),
    constantKey: deriveRouteConstantKey(path),
  });
};

export const laravelRoutePathResolutionAuthority: LaravelRoutePathResolutionAuthority = Object.freeze({
  kind: 'laravel_route_path_resolution_authority',
  contractVersion: 1,
  closed: true,
  resolve,
});

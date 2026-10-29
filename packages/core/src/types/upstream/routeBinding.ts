import type { RouteParameter } from './route';
import type { RouteParameterName } from './names';
import type { RouteParameters } from './collections';
import type { Sequence } from './collections';

export interface RouteBindingDomainOperationsInterface {
  readonly containsParameter: (name: RouteParameterName) => boolean;
  readonly isBound: (name: RouteParameterName) => boolean;
}

export interface RouteBindingInterface {
  readonly parameters: RouteParameters;
  readonly modelParameters: Sequence<RouteParameter>;
  readonly implicitModelParameters: Sequence<RouteParameter>;
  readonly explicitBindings: Sequence<RouteParameter>;
  readonly scopedBindings: Sequence<RouteParameter>;
  readonly bound: Sequence<RouteParameter>;
  readonly operations: RouteBindingDomainOperationsInterface;
}

export interface RouteBindingInterfaceFactoryInterface {
  readonly kind: 'route_binding_interface_factory';
  readonly fromParameters: (parameters: RouteParameters) => RouteBindingInterface;
}

const items = <T>(value: Sequence<T>, output: readonly T[] = []): readonly T[] =>
  value.kind === 'empty' ? output : items(value.tail, [...output, value.head]);

const sequence = <T>(values: readonly T[], index = 0): Sequence<T> =>
  index < values.length ? { kind: 'cons', head: values[index], tail: sequence(values, index + 1) } : { kind: 'empty' };

const fromParameters = (parameters: RouteParameters): RouteBindingInterface => {
  const all = items(parameters.items);
  const modelParameters = all.filter(parameter => parameter.type.kind === 'model');
  const implicitModelParameters = all.filter(parameter => parameter.binding.kind === 'implicit_model');
  const explicitBindings = all.filter(parameter => parameter.binding.kind === 'explicit' || parameter.binding.kind === 'custom');
  const scopedBindings = all.filter(parameter => parameter.binding.kind === 'implicit_model' && parameter.binding.scoped.value === true);
  const bound = all.filter(parameter => parameter.binding.kind !== 'convention');
  const nameMatches = (left: RouteParameterName, right: RouteParameterName): boolean => left.value.value === right.value.value;
  const operations: RouteBindingDomainOperationsInterface = Object.freeze({
    containsParameter: (name: RouteParameterName): boolean => all.some(parameter => nameMatches(parameter.name, name)),
    isBound: (name: RouteParameterName): boolean => bound.some(parameter => nameMatches(parameter.name, name)),
  });
  return Object.freeze({
    parameters,
    modelParameters: sequence(modelParameters),
    implicitModelParameters: sequence(implicitModelParameters),
    explicitBindings: sequence(explicitBindings),
    scopedBindings: sequence(scopedBindings),
    bound: sequence(bound),
    operations,
  });
};

export const routeBindingInterfaceFactory: RouteBindingInterfaceFactoryInterface = Object.freeze({
  kind: 'route_binding_interface_factory',
  fromParameters,
});

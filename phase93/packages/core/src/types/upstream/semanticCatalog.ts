import type { ActionName, ClassName, EnumName, ModelName, RouteParameterName } from './names';
import type { RouteActionParameterContract } from './routeBindingResolution';

export interface SemanticIdentityCatalog {
  readonly actionParameters: ReadonlyMap<string, RouteActionParameterContract>;
  readonly models: ReadonlyMap<string, ModelName>;
  readonly enums: ReadonlyMap<string, EnumName>;
  readonly actions: ReadonlyMap<string, ActionName>;
}

export function createSemanticIdentityCatalog(input: {
  readonly actionParameters: readonly RouteActionParameterContract[];
  readonly modelNames: readonly ModelName[];
  readonly enumNames: readonly EnumName[];
}): SemanticIdentityCatalog {
  const actionParameters = new Map<string, RouteActionParameterContract>();
  for (const parameter of input.actionParameters) actionParameters.set(parameter.parameter.value.value, parameter);
  const models = new Map<string, ModelName>();
  for (const model of input.modelNames) models.set(model.value.value, model);
  const enums = new Map<string, EnumName>();
  for (const value of input.enumNames) enums.set(value.value.value, value);
  return Object.freeze({ actionParameters, models, enums, actions: new Map<string, ActionName>() });
}

export const identityClassKey = (type: ClassName): string => type.value.value;
export const identityParameterKey = (parameter: RouteParameterName): string => parameter.value.value;

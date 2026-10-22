import type {
  ControllerActionBindingAlgebraInterface,
  ControllerActionBindingInput,
  ControllerActionBindingResult,
  ControllerActionIdentity,
} from './controllerActionBinding';

const sameIdentity = (
  left: ControllerActionIdentity,
  right: ControllerActionIdentity,
): boolean => left.controller.value.value === right.controller.value.value
  && left.action.value.value === right.action.value.value;

const resolve = <TPolicy, TController>(
  input: ControllerActionBindingInput<TPolicy, TController>,
): ControllerActionBindingResult<TPolicy, TController> => {
  const supplied = input.suppliedPolicies.filter(candidate => sameIdentity(candidate.identity, input.identity));
  if (supplied.length > 1) {
    return Object.freeze({ kind: 'supplied_policy_ambiguous', candidates: Object.freeze(supplied) });
  }
  if (supplied.length === 1) {
    const candidate = supplied[0];
    if (candidate !== undefined) return Object.freeze({ kind: 'supplied_policy', value: candidate.value });
  }

  const controllers = input.catalogControllers.filter(candidate => sameIdentity(candidate.identity, input.identity));
  if (controllers.length > 1) {
    return Object.freeze({ kind: 'catalog_controller_ambiguous', candidates: Object.freeze(controllers) });
  }
  if (controllers.length === 1) {
    const candidate = controllers[0];
    if (candidate !== undefined) return Object.freeze({ kind: 'catalog_controller', value: candidate.value });
  }
  return Object.freeze({ kind: 'unbound' });
};

export const controllerActionBindingAlgebra: ControllerActionBindingAlgebraInterface = Object.freeze({ resolve });

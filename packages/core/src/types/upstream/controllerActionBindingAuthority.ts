import type { ControllerActionBindingAuthorityInterface } from './controllerActionBinding';
import { controllerActionBindingAlgebra } from './controllerActionBindingAlgebra';

/** Canonical upstream binding authority; identity matching is delegated to the algebra. */
export const controllerActionBindingAuthority: ControllerActionBindingAuthorityInterface = Object.freeze({
  resolve: controllerActionBindingAlgebra.resolve,
});

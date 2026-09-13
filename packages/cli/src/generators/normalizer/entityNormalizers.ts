/**
 * entityNormalizers.ts
 *
 * Normalizers for Laravel resources, models, and routes into unified IR representations.
 * Active Consumer delegating to focused entity normalizers sub-domain.
 *
 * @module cli/generators/normalizer
 */

import {
  normalizeResources,
  normalizeModels,
  normalizeRoutes
} from './entities';

export {
  normalizeResources,
  normalizeModels,
  normalizeRoutes
};

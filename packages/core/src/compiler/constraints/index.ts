/**
 * Constraints Module
 * Barrel export for constraint solving functionality
 */

export type { TypeVariable } from './TypeVariable';
export type { Constraint, ConstraintViolation } from './Constraint';
export { TypeEnvironment, type VariableState } from './TypeEnvironment';
export { UnionFind } from './UnionFind';
export { solveConstraints, type ConstraintSolveResult } from './ConstraintSolver';

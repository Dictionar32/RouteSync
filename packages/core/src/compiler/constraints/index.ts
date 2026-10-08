/**
 * Constraints Module
 * Barrel export for constraint solving functionality
 */

export type { TypeVariable } from './TypeVariable';
export type { Constraint, ConstraintViolation } from './Constraint';
export { type TypeEnvironment, type VariableState, createTypeEnvironment } from './TypeEnvironment';
export { type UnionFind, createUnionFind, unionFindFind, unionFindUnion } from './UnionFind';
export { solveConstraints, type ConstraintSolveResult } from './ConstraintSolver';

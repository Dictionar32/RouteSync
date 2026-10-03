/** Relation-native type lattice operations. */
import type { SemanticType } from './SemanticType';
import type { TypeHierarchy } from './TypeHierarchy';
import { computeJoin, computeMeet, checkSubtype, checkAssignable } from './system';

export { computeJoin, computeMeet, checkSubtype, checkAssignable };

export const isSubtype = (source: SemanticType, target: SemanticType, hierarchy: TypeHierarchy): boolean =>
    checkSubtype(source, target, hierarchy, (left, right) => isAssignable(left, right, hierarchy));

export const isAssignable = (source: SemanticType, target: SemanticType, hierarchy: TypeHierarchy): boolean =>
    checkAssignable(source, target, (left, right) => isSubtype(left, right, hierarchy));

export const createTypeSystem = (hierarchy: TypeHierarchy) => Object.freeze({
    join: (left: SemanticType, right: SemanticType): SemanticType => computeJoin(left, right),
    meet: (left: SemanticType, right: SemanticType): SemanticType => computeMeet(left, right),
    isSubtype: (left: SemanticType, right: SemanticType): boolean => isSubtype(left, right, hierarchy),
    isAssignable: (left: SemanticType, right: SemanticType): boolean => isAssignable(left, right, hierarchy)
});

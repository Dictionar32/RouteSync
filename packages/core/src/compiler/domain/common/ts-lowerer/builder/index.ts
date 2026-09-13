/**
 * TypeScript Builder Sub-Domain.
 * Conforms to Rule 14: Zero wildcard re-exports (0 `export * from`).
 *
 * @module compiler/domain/common/ts-lowerer/builder
 */

export {
    lowerTypeExpression,
    lowerProperty
} from './typeExpressionLowerer';

export {
    lowerObjectType,
    compileTypeStream
} from './objectTypeLowerer';

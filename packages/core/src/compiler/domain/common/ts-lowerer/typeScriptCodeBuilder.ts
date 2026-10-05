/**
 * typeScriptCodeBuilder.ts
 *
 * Structured Code Builder consuming Canonical ObjectType[] AST streams.
 * Active Consumer: Orchestrates TypeScript code building and metadata generation.
 *
 * @module compiler/domain/common/ts-lowerer/typeScriptCodeBuilder
 */

import type {
    ObjectType,
    SemanticType,
    ObjectProperty
} from '../../../types/SemanticType';
import {
    TypeScriptTargetVersion,
    type TypeScriptLowererOptions
} from './typeScriptVocabulary';
import type {
    LoweredTypeDeclaration,
    TypeScriptBuildResult
} from './typeScriptMetadata';
import { relationGate } from '../../../../semantic/foundation/relationalSequence';

import {
    lowerTypeExpression as lowerTypeExpressionNode,
    lowerProperty as lowerPropertyNode,
    lowerObjectType as lowerObjectTypeNode,
    compileTypeStream
} from './builder/index';

export interface TypeScriptCodeBuilder {
    readonly targetVersion: TypeScriptTargetVersion;
    readonly includeJsDoc: boolean;
    readonly lowerTypeExpression: (type: SemanticType) => string;
    readonly lowerProperty: (prop: ObjectProperty) => string;
    readonly lowerObjectType: (objType: ObjectType) => LoweredTypeDeclaration;
    readonly build: (types: readonly ObjectType[]) => TypeScriptBuildResult;
}

export const TypeScriptCodeBuilder = (options: TypeScriptLowererOptions = {}): TypeScriptCodeBuilder => {
    const targetVersion = relationGate(Object.prototype.hasOwnProperty.call(options, 'targetVersion'), () => options.targetVersion as TypeScriptTargetVersion, () => TypeScriptTargetVersion.ES2022);
    const includeJsDoc = relationGate(Object.prototype.hasOwnProperty.call(options, 'includeJsDoc'), () => options.includeJsDoc as boolean, () => true);
    const lowerTypeExpressionValue = (type: SemanticType): string => lowerTypeExpressionNode(type);
    const lowerPropertyValue = (prop: ObjectProperty): string => lowerPropertyNode(prop, includeJsDoc);
    const lowerObjectType = (objType: ObjectType): LoweredTypeDeclaration => lowerObjectTypeNode(objType, lowerPropertyValue);
    const build = (types: readonly ObjectType[]): TypeScriptBuildResult => compileTypeStream(types, lowerPropertyValue);
    return Object.freeze({ targetVersion, includeJsDoc, lowerTypeExpression: lowerTypeExpressionValue, lowerProperty: lowerPropertyValue, lowerObjectType, build });
};

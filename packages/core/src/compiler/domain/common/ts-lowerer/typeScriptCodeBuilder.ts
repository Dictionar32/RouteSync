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
import {
    lowerTypeExpression,
    lowerProperty,
    lowerObjectType,
    compileTypeStream
} from './builder/index';

export class TypeScriptCodeBuilder {
    public readonly targetVersion: TypeScriptTargetVersion;
    public readonly includeJsDoc: boolean;

    constructor({
        targetVersion = TypeScriptTargetVersion.ES2022,
        includeJsDoc = true
    }: TypeScriptLowererOptions = {}) {
        this.targetVersion = targetVersion;
        this.includeJsDoc = includeJsDoc;
        Object.freeze(this);
    }

    public readonly lowerTypeExpression = (type: SemanticType): string => {
        return lowerTypeExpression(type);
    };

    public readonly lowerProperty = (prop: ObjectProperty): string => {
        return lowerProperty(prop, this.includeJsDoc);
    };

    /**
     * Single Atomic Lowering:
     * Generates declaration code AND its metadata together in one sync pass.
     */
    public readonly lowerObjectType = (objType: ObjectType): LoweredTypeDeclaration => {
        return lowerObjectType(objType, this.lowerProperty);
    };

    /**
     * Compiles ObjectType[] AST streams into a complete build result.
     * Single linear pass: Code and metadata collected simultaneously.
     */
    public readonly build = (types: readonly ObjectType[]): TypeScriptBuildResult => {
        return compileTypeStream(types, this.lowerProperty);
    };
}

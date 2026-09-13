/**
 * objectTypeLowerer.ts
 *
 * Compiles ObjectType into interface declarations and resource aliases.
 *
 * @module compiler/domain/common/ts-lowerer/builder
 */

import type { ObjectType, ObjectProperty } from '../../../../types/SemanticType';
import { ControllerActionToAlias } from '../typeScriptVocabulary';
import { TypeScriptSyntax } from '../typeScriptSyntax';
import {
    SourceLineRange,
    type GeneratedInterfaceMetadata,
    type LoweredTypeDeclaration,
    type TypeScriptBuildResult
} from '../typeScriptMetadata';

export function lowerObjectType(
    objType: ObjectType,
    lowerPropertyFn: (prop: ObjectProperty) => string
): LoweredTypeDeclaration {
    const seenProps = new Set<string>();
    const uniqueProps = objType.properties.filter(p => {
        if (seenProps.has(p.name)) return false;
        seenProps.add(p.name);
        return true;
    });

    const ifaceDecl = TypeScriptSyntax.formatInterface(
        objType.name,
        uniqueProps,
        lowerPropertyFn
    );
    const showAlias = TypeScriptSyntax.formatResourceAlias(
        objType.baseName,
        ControllerActionToAlias.show,
        objType.name
    );
    const indexAlias = TypeScriptSyntax.formatResourceAlias(
        objType.baseName,
        ControllerActionToAlias.index,
        TypeScriptSyntax.array(objType.name)
    );
    const aliases = TypeScriptSyntax.joinDeclarations([showAlias, indexAlias]);
    const code = TypeScriptSyntax.joinBlocks([ifaceDecl, aliases]);

    return {
        code,
        metadata: {
            name: objType.name,
            propertyCount: uniqueProps.length,
            lineRange: SourceLineRange.Unmapped
        }
    };
}

export function compileTypeStream(
    types: readonly ObjectType[],
    lowerPropertyFn: (prop: ObjectProperty) => string
): TypeScriptBuildResult {
    const declarations: string[] = [];
    const interfaces: GeneratedInterfaceMetadata[] = [];
    const seenInterfaceNames = new Set<string>();
    const seenAliases = new Set<string>();
    let currentLine = 1;

    for (const objType of types) {
        if (seenInterfaceNames.has(objType.name)) {
            continue;
        }
        seenInterfaceNames.add(objType.name);

        const seenProps = new Set<string>();
        const uniqueProps = objType.properties.filter(p => {
            if (seenProps.has(p.name)) return false;
            seenProps.add(p.name);
            return true;
        });

        const ifaceDecl = TypeScriptSyntax.formatInterface(
            objType.name,
            uniqueProps,
            lowerPropertyFn
        );

        const aliasDecls: string[] = [];
        const showKey = `${objType.baseName}Show`;
        if (!seenAliases.has(showKey)) {
            seenAliases.add(showKey);
            aliasDecls.push(TypeScriptSyntax.formatResourceAlias(
                objType.baseName,
                ControllerActionToAlias.show,
                objType.name
            ));
        }
        const indexKey = `${objType.baseName}Index`;
        if (!seenAliases.has(indexKey)) {
            seenAliases.add(indexKey);
            aliasDecls.push(TypeScriptSyntax.formatResourceAlias(
                objType.baseName,
                ControllerActionToAlias.index,
                TypeScriptSyntax.array(objType.name)
            ));
        }

        const blocks = aliasDecls.length > 0
            ? [ifaceDecl, TypeScriptSyntax.joinDeclarations(aliasDecls)]
            : [ifaceDecl];
        const code = TypeScriptSyntax.joinBlocks(blocks);

        const lineCount = code.split('\n').length;
        const lineRange = SourceLineRange.create(currentLine, currentLine + lineCount - 1);

        declarations.push(code);
        interfaces.push({
            name: objType.name,
            propertyCount: uniqueProps.length,
            lineRange
        });

        currentLine += lineCount + 1;
    }

    const code = TypeScriptSyntax.joinBlocks(declarations);

    return {
        code,
        interfaces: Object.freeze(interfaces)
    };
}

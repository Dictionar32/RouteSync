/**
 * SemanticTypeDeriver.ts
 *
 * Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
 *
 * @module core/compiler/scanner/subscanners/SemanticTypeDeriver
 */

import {
    ParsedRoute,
    ParsedResource,
    ParsedModel,
    ResourceFieldDescriptor,
    ResourceFieldExpressionFactory,
    DatabaseColumnTypeMapper,
    InlineResponseDescriptor
} from "../../../types/route";
import {
    ObjectType,
    ObjectProperty,
    ScannedObjectProperty,
    PrimitiveType,
    PrimitiveKind,
    NullableType,
    ReadonlyCollectionType,
    CollectionKind,
    ReferenceType,
    SemanticType
} from "../../types/SemanticType";
import { TypeInterner } from "../../types/TypeInterner";
import {
    toCamelCase,
    toPascalCase,
    extractClassBasename
} from "../../../utils/resource-naming";
import { ScannedResourceFieldDescriptor } from "../descriptors/resourceDescriptors";
import { resolvePrimitiveKind } from "./typeDeriverUtils";

export class SemanticTypeDeriver {
    /**
     * Derives Canonical ObjectType[] AST streams leveraging Core TypeInterner and SymbolTable.
     */
    public static derive(
        resources: readonly ParsedResource[] = [],
        models: readonly ParsedModel[] = [],
        interner: TypeInterner = new TypeInterner(),
        routes: readonly ParsedRoute[] = []
    ): readonly ObjectType[] {
        const types: ObjectType[] = [];
        const seenNames = new Set<string>();

        // 1. Resources
        for (const res of resources) {
            const rawFields: readonly ResourceFieldDescriptor[] = Array.isArray(res.fields)
                ? res.fields
                : Object.entries((res.fields as any) || {}).map(([name, val]: [string, any]) => {
                    const isNull = !!(val?.nullable ?? val?.expression?.nullable ?? val?.resolved?.nullable ?? (typeof val?.resolved?.type === 'string' && val.resolved.type.includes('null')));
                    const expr = val?.expression ?? (val?.kind ? val : ResourceFieldExpressionFactory.primitive(val?.type));
                    const resolvedType = val?.resolved?.type ?? expr?.resolved?.type ?? expr?.type ?? '';
                    const semType = resolvePrimitiveKind(resolvedType);

                    return ScannedResourceFieldDescriptor.create({
                        name,
                        propertyName: toCamelCase(name),
                        expression: expr,
                        semanticType: semType,
                        nullable: isNull
                    });
                });

            const properties: ObjectProperty[] = [];

            const processField = (field: ResourceFieldDescriptor, prefix = '', isNullable = false) => {
                const camelKey = toCamelCase(field.name);
                const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;
                const fKind = field.expression as any;

                if (fKind && typeof fKind === 'object' && (fKind.kind === 'object' || fKind.fields)) {
                    const rawChild = Array.isArray(fKind.fields) ? fKind.fields : Object.entries(fKind.fields || {});
                    for (const cf of rawChild) {
                        const cName = Array.isArray(cf) ? cf[0] : cf.name;
                        const cVal = Array.isArray(cf) ? cf[1] : cf;
                        const childTypeStr = cVal?.type ?? cVal?.resolved?.type ?? cVal?.expression?.type ?? '';
                        const childSemType = resolvePrimitiveKind(childTypeStr);

                        const childDesc: ResourceFieldDescriptor = (cVal && typeof cVal === 'object' && 'expression' in cVal)
                            ? (cVal as ResourceFieldDescriptor)
                            : ScannedResourceFieldDescriptor.create({
                                name: cName,
                                propertyName: toCamelCase(cName),
                                expression: cVal?.expression ?? (cVal?.kind ? cVal : ResourceFieldExpressionFactory.primitive(cVal?.type)),
                                semanticType: childSemType,
                                nullable: isNullable || !!fKind.nullable
                            });
                        processField(childDesc, propName, isNullable || !!fKind.nullable);
                    }
                    return;
                }

                const resolvedType = field.semanticType ?? fKind?.resolved?.type ?? fKind?.type ?? '';
                const primKind = resolvePrimitiveKind(resolvedType);
                let propType: SemanticType = new PrimitiveType(primKind);
                const fieldNullable = isNullable || field.nullable || fKind?.nullable || String(resolvedType).toLowerCase().includes('null');

                if (fKind && (fKind.kind === 'array' || fKind.collection)) {
                    const targetRes = fKind.resolved?.resource ?? fKind.resource;
                    const elemType = targetRes 
                        ? new ReferenceType('', `${toPascalCase(targetRes)}Transformed`)
                        : new PrimitiveType(PrimitiveKind.STRING);
                    propType = new ReadonlyCollectionType(CollectionKind.ARRAY, elemType);
                }

                if (fieldNullable) {
                    propType = new NullableType(propType);
                }
                const internedType = interner.intern(propType);

                properties.push(ScannedObjectProperty.create({
                    name: propName,
                    type: internedType,
                    required: true,
                    nullable: !!fieldNullable
                }));
            };

            for (const f of rawFields) {
                processField(f, '', !!f.nullable);
            }
            const baseName = res.name.endsWith('Transformed') ? res.name.replace(/Transformed$/, '') : res.name;
            const typeName = res.typeName ?? (res.name.endsWith('Transformed') ? res.name : `${res.name}Transformed`);
            seenNames.add(typeName);
            const objType = new ObjectType({ name: typeName, baseName, properties });
            types.push(interner.intern(objType) as ObjectType);
        }

        // 2. Routes (Inline Responses)
        for (const route of routes) {
            let typeName = '';
            let baseName = '';
            let rawFields: any[] = [];

            if (route.response && route.response.kind === 'inline') {
                const inlineResp = route.response as InlineResponseDescriptor;
                typeName = inlineResp.typeName;
                baseName = inlineResp.baseName;
                rawFields = Array.isArray(inlineResp.fields) ? inlineResp.fields : Object.entries(inlineResp.fields || {});
            } else if (route.response && 'fields' in route.response && (route.response as any).fields) {
                const rawDomain = (route as any).domain || route.resourceName || (route.actionName ? route.actionName.replace(/Controller$/, '') : '') || 'Inline';
                typeName = `${toPascalCase(rawDomain)}Transformed`;
                baseName = toPascalCase(rawDomain);
                rawFields = Array.isArray((route.response as any).fields) ? (route.response as any).fields : Object.entries((route.response as any).fields);
            } else if (route.response && (route.response.kind === 'resource' || (route.response as any).resourceName)) {
                const rawDomain = (route as any).domain || route.resourceName || '';
                if (rawDomain && !rawDomain.endsWith('Resource')) {
                    const pascalDomain = toPascalCase(rawDomain);
                    typeName = `${pascalDomain}Transformed`;
                    baseName = pascalDomain;
                    const resName = (route.response as any).resourceName;
                    const targetRes = resName ? `${toPascalCase(resName)}Transformed` : 'unknown';
                    rawFields = [{
                        name: 'data',
                        kind: 'collection',
                        elementType: { kind: 'reference', name: targetRes }
                    }];
                }
            }

            if (typeName && !seenNames.has(typeName)) {
                seenNames.add(typeName);
                const properties: ObjectProperty[] = [];
                const processEntries = (entries: any[], prefix = '') => {
                    for (const item of entries) {
                        const name = Array.isArray(item) ? item[0] : item.name;
                        const val = Array.isArray(item) ? item[1] : item;
                        const camelKey = toCamelCase(name);
                        const propName = prefix ? `${prefix}${camelKey.charAt(0).toUpperCase()}${camelKey.slice(1)}` : camelKey;

                        const valExpr = val?.expression ?? val;

                        if (valExpr && typeof valExpr === 'object' && (valExpr.kind === 'object' || valExpr.fields)) {
                            const childEntries = Array.isArray(valExpr.fields) ? valExpr.fields : Object.entries(valExpr.fields || {});
                            processEntries(childEntries, propName);
                        } else if (valExpr && (valExpr.kind === 'collection' || valExpr.kind === 'array' || valExpr.collection || valExpr.elementType)) {
                            const elem = valExpr.elementType ?? valExpr.element;
                            let elemType: SemanticType = new PrimitiveType(PrimitiveKind.STRING);
                            if (elem?.model) {
                                const foundModel = models.find(m => m.name === elem.model || m.name.toLowerCase() === elem.model.toLowerCase());
                                if (foundModel && foundModel.columns) {
                                    const modelProps: ObjectProperty[] = foundModel.columns.map(c => {
                                        const primKind = c.semanticType ?? DatabaseColumnTypeMapper.toPrimitiveKind(c.type);
                                        let pType: SemanticType = new PrimitiveType(primKind);
                                        if (c.nullable) {
                                            pType = new NullableType(pType);
                                        }
                                        return ScannedObjectProperty.create({
                                            name: toCamelCase(c.name),
                                            type: interner.intern(pType),
                                            nullable: !!c.nullable,
                                            required: true
                                        });
                                    });
                                    const modelBaseName = extractClassBasename(elem.model);
                                    elemType = new ObjectType({ name: toCamelCase(elem.model), baseName: modelBaseName, properties: modelProps });
                                } else {
                                    elemType = new ReferenceType('', `${toPascalCase(elem.model)}Transformed`);
                                }
                            } else if (elem?.name) {
                                elemType = new ReferenceType('', elem.name);
                            }
                            properties.push(ScannedObjectProperty.create({
                                name: propName,
                                type: interner.intern(new ReadonlyCollectionType(CollectionKind.ARRAY, elemType)),
                                nullable: false,
                                required: true
                            }));
                        } else {
                            const vType = valExpr?.type ?? val?.type ?? val?.resolved?.type ?? '';
                            const isUnknown = valExpr?.kind === 'unknown' || String(vType).toLowerCase() === 'unknown';
                            const isNull = !!(val?.nullable || valExpr?.nullable || val?.resolved?.nullable || String(vType).toLowerCase().includes('null'));
                            const prim = isUnknown ? PrimitiveKind.UNKNOWN : resolvePrimitiveKind(val?.semanticType ?? vType);
                            let propType: SemanticType = new PrimitiveType(prim);
                            if (isNull) {
                                propType = new NullableType(propType);
                            }
                            properties.push(ScannedObjectProperty.create({
                                name: propName,
                                type: interner.intern(propType),
                                nullable: isNull,
                                required: true
                            }));
                        }
                    }
                };

                processEntries(rawFields);
                types.push(interner.intern(new ObjectType({ name: typeName, baseName, properties })) as ObjectType);
            }
        }

        // 3. Models
        for (const model of models) {
            const modelTypeName = `${toPascalCase(model.name)}Transformed`;
            const modelBaseName = toPascalCase(model.name);
            if (!seenNames.has(modelTypeName)) {
                seenNames.add(modelTypeName);
                const properties: ObjectProperty[] = [];
                const seenPropNames = new Set<string>();

                for (const col of (model.columns || [])) {
                    if (model.hidden && model.hidden.includes(col.name)) continue;
                    const propName = toCamelCase(col.name);
                    seenPropNames.add(propName);

                    const cast = model.casts ? (model.casts as any)[col.name] : undefined;
                    const colTypeStr = cast ?? col.semanticType ?? col.type ?? '';
                    const primKind = resolvePrimitiveKind(colTypeStr);

                    let propType: SemanticType = new PrimitiveType(primKind);
                    if (col.nullable) {
                        propType = new NullableType(propType);
                    }
                    properties.push(ScannedObjectProperty.create({
                        name: propName,
                        type: interner.intern(propType),
                        nullable: !!col.nullable,
                        required: true
                    }));
                }

                const appendKeys = new Set<string>([
                    ...(model.appends || []),
                    ...Object.keys(model.accessors || {})
                ]);
                for (const key of appendKeys) {
                    const propName = toCamelCase(key);
                    if (seenPropNames.has(propName)) continue;
                    seenPropNames.add(propName);

                    const accessor = model.accessors ? (model.accessors as any)[key] : undefined;
                    const accType = accessor?.semantic?.type ?? 'string';
                    const primKind = resolvePrimitiveKind(accType);

                    properties.push(ScannedObjectProperty.create({
                        name: propName,
                        type: interner.intern(new PrimitiveType(primKind)),
                        nullable: false,
                        required: true
                    }));
                }

                types.push(interner.intern(new ObjectType({
                    name: modelTypeName,
                    baseName: modelBaseName,
                    properties
                })) as ObjectType);
            }
        }

        return types;
    }
}

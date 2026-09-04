import { describe, it, expect } from 'vitest';
import { manifestToSemanticTypes, manifestToContractInput } from '../../cli/src/generators/utils/manifest-to-types';
import { TypeScriptGeneratorPass } from '../../core/src/compiler/passes/TypeScriptGeneratorPass';
import { MapperGeneratorPass } from '../../core/src/compiler/passes/MapperGeneratorPass';
import { UnionType, IntersectionType, ObjectType, PrimitiveType, PrimitiveKind } from '../../core/src/compiler/types/SemanticType';
import type { RouteManifest } from '../../core/src/types/route';
import { ScannedRouteManifestDescriptor } from '../../core/src/compiler/scanner/StaticLaravelScanner';

describe('Zero New Pipeline SSOT Specification', () => {
    it('1. should instantiate UnionType and IntersectionType using static of() factory without new', () => {
        const primA = new PrimitiveType(PrimitiveKind.STRING);
        const primB = new PrimitiveType(PrimitiveKind.NUMBER);

        const union = UnionType.of(primA, primB);
        expect(union.kind).toBe('union');
        expect(union.members.length).toBe(2);

        const intersection = IntersectionType.of(primA, primB);
        expect(intersection.kind).toBe('intersection');
        expect(intersection.members.length).toBe(2);
    });

    it('2. should instantiate ObjectType using static create() and empty() without new', () => {
        const emptyObj = ObjectType.empty('User');
        expect(emptyObj.kind).toBe('object');
        expect(emptyObj.name).toBe('User');
        expect(emptyObj.properties.length).toBe(0);

        const createdObj = ObjectType.create({
            name: 'User',
            baseName: 'User',
            properties: []
        });
        expect(createdObj.name).toBe('User');
    });

    it('3. should execute TypeScriptGeneratorPass.run and MapperGeneratorPass.run statically without new', () => {
        const manifest: RouteManifest = ScannedRouteManifestDescriptor.create({
            routes: [
                {
                    domain: 'Category',
                    path: '/api/categories',
                    method: 'GET',
                    action: 'CategoryController@index',
                    rules: {},
                    response: {
                        kind: 'object',
                        fields: {
                            id: { kind: 'primitive', type: 'int' },
                            name: { kind: 'primitive', type: 'string' }
                        }
                    }
                }
            ],
            resources: [],
            models: []
        });

        // Static pipeline without new
        const semanticArtifact = manifestToSemanticTypes(manifest);
        const [tsArtifact] = TypeScriptGeneratorPass.run(semanticArtifact);

        expect(tsArtifact.code).toContain('export interface CategoryTransformed {');
        expect(tsArtifact.code).toContain('export type CategoryShow = CategoryTransformed;');
        expect(tsArtifact.code).toContain('export type CategoryIndex = Array<CategoryTransformed>;');

        // Static mapper without new
        const contractInput = manifestToContractInput(manifest);
        const [mapperArtifact] = MapperGeneratorPass.run(contractInput);

        expect(mapperArtifact.code).toContain('export const toCategoryRead = (api: CategoryApiResponse): CategoryTransformed => ({');
        expect(mapperArtifact.code).toContain('id: api.id,');
        expect(mapperArtifact.code).toContain('name: api.name,');
    });
});

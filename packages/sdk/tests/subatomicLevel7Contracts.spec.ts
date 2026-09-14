import { describe, it, expect } from 'vitest';
import type {
  ResponseDescriptorContract,
  JsonTransportContract,
  BinaryTransportContract,
  StreamTransportContract,
  RedirectTransportContract
} from '@routesync/core';
import type {
  ResponseFieldContract,
  PrimitiveResponseFieldContract,
  ObjectResponseFieldContract,
  ArrayResponseFieldContract
} from '@routesync/core';
import type {
  SemanticRelationContract,
  BelongsToManyRelationContract,
  DirectRelationContract,
  MorphRelationContract
} from '@routesync/core';
import type {
  RouteDefContract,
  ResourceDefContract,
  ModelDefContract
} from '@routesync/core';

describe('Level 7 Subatomic Discriminated ADT Contracts (Rule 15)', () => {
  it('instantiates closed ResponseDescriptor ADT variants with zero undefined or null', () => {
    const jsonResp: JsonTransportContract = {
      transport: 'json',
      status: 200,
      contentType: 'application/json',
      nullable: false,
      schemaFields: ['id', 'name', 'price']
    };

    const binaryResp: BinaryTransportContract = {
      transport: 'binary',
      status: 200,
      contentType: 'application/pdf',
      nullable: false,
      dispositionType: 'attachment',
      filename: 'invoice.pdf'
    };

    const streamResp: StreamTransportContract = {
      transport: 'stream',
      status: 200,
      contentType: 'text/event-stream',
      nullable: false,
      chunked: true,
      callback: 'streamHandler'
    };

    const redirectResp: RedirectTransportContract = {
      transport: 'redirect',
      status: 302,
      contentType: 'text/html',
      nullable: false,
      redirectType: 'route',
      target: 'home',
      parameters: ['ref=dashboard']
    };

    const descriptors: ResponseDescriptorContract[] = [jsonResp, binaryResp, streamResp, redirectResp];
    expect(descriptors).toHaveLength(4);
    for (const d of descriptors) {
      expect(d.status).toBeGreaterThan(0);
      expect(d.contentType).toBeDefined();
      expect(typeof d.nullable).toBe('boolean');
    }
  });

  it('instantiates Subatomic Functor & ResponseField ADT variants without undefined or null', () => {
    const scalarField: PrimitiveResponseFieldContract = {
      kind: 'primitive',
      typeName: 'string',
      shape: { kind: 'identity', inner: 'scalar' }
    };

    const arrayField: ArrayResponseFieldContract = {
      kind: 'array',
      item: scalarField,
      shape: { kind: 'collection', inner: { kind: 'identity', inner: 'array' } }
    };

    const objectField: ObjectResponseFieldContract = {
      kind: 'object',
      fieldEntries: [
        ['title', scalarField],
        ['tags', arrayField]
      ],
      shape: { kind: 'identity', inner: 'object' }
    };

    const fields: ResponseFieldContract[] = [scalarField, arrayField, objectField];
    expect(fields).toHaveLength(3);
    expect(objectField.fieldEntries).toHaveLength(2);
    expect(objectField.fieldEntries[0][0]).toBe('title');
  });

  it('instantiates SemanticRelation closed ADT variants without sentinel undefined or null', () => {
    const directRel: DirectRelationContract = {
      kind: 'belongsTo',
      model: 'User',
      foreignKey: 'user_id',
      localKey: 'id'
    };

    const belongsToManyRel: BelongsToManyRelationContract = {
      kind: 'belongsToMany',
      model: 'Role',
      foreignKey: 'user_id',
      relatedKey: 'role_id',
      pivotTable: 'role_user',
      pivotFields: [
        ['created_at', 'string'],
        ['expires_at', 'string']
      ]
    };

    const morphRel: MorphRelationContract = {
      kind: 'morphMany',
      model: 'Comment',
      morphName: 'commentable',
      morphType: 'commentable_type',
      morphId: 'commentable_id'
    };

    const relations: SemanticRelationContract[] = [directRel, belongsToManyRel, morphRel];
    expect(relations).toHaveLength(3);
    expect(belongsToManyRel.pivotFields).toHaveLength(2);
  });

  it('instantiates RouteDefContract, ResourceDefContract, and ModelDefContract without undefined or null', () => {
    const routeDef: RouteDefContract = {
      identity: { name: 'api.posts.index', method: 'GET', path: '/api/posts' },
      security: { auth: true, middleware: ['auth:sanctum'] },
      payload: {
        schemaEntries: [['page', 'number']],
        response: { kind: 'primitive', type: 'string' },
        assignments: [['limit', '10']]
      },
      provenance: { stableHash: 'hash-123', sourceFile: 'routes/api.php', sourceLine: 42 }
    };

    const resourceDef: ResourceDefContract = {
      name: 'PostResource',
      model: 'Post',
      fields: [['id', { kind: 'primitive', type: 'number' }]],
      assignments: [['id', 'id']],
      sourceFile: 'app/Http/Resources/PostResource.php',
      sourceLine: 15
    };

    const modelDef: ModelDefContract = {
      name: 'Post',
      table: 'posts',
      columns: [{ name: 'id', type: 'bigint', nullable: false }],
      hidden: ['secret'],
      appends: ['url'],
      casts: [['id', 'integer']],
      relations: [['author', { type: 'belongsTo', model: 'User' }]],
      accessors: [['url', { kind: 'primitive', type: 'string' }]]
    };

    expect(routeDef.identity.path).toBe('/api/posts');
    expect(resourceDef.model).toBe('Post');
    expect(modelDef.table).toBe('posts');
  });
});

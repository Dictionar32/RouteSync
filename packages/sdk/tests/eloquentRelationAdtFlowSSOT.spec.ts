import { describe, test, expect } from 'vitest'
import {
  matchRelationCardinality,
  matchRelation,
  matchRelationType,
  ELOQUENT_RELATION_REGISTRY,
  EloquentRelationType,
  EloquentRelationClassifier,
  SingleRelationDescriptor,
  CollectionRelationDescriptor,
  ScannedModelRelationDescriptor
} from '../../core/src'

describe('EloquentRelation ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchRelation / matchRelationCardinality executes pure catamorphism for single relation', () => {
    const rel: SingleRelationDescriptor = ScannedModelRelationDescriptor.single({
      name: 'author',
      type: EloquentRelationType.BelongsTo,
      modelName: 'User',
      targetModel: 'App\\Models\\User'
    })

    const typeStr = matchRelation(rel, {
      one: (r) => `${r.name}: ${r.modelName}`,
      many: (r) => `${r.name}: ${r.modelName}[]`
    })

    expect(typeStr).toBe('author: User')
    expect(rel.cardinality).toBe('one')
    expect(rel.isCollection).toBe(false)
  })

  test('2. matchRelation / matchRelationCardinality executes pure catamorphism for collection relation', () => {
    const rel: CollectionRelationDescriptor = ScannedModelRelationDescriptor.collection({
      name: 'comments',
      type: EloquentRelationType.HasMany,
      modelName: 'Comment',
      targetModel: 'App\\Models\\Comment'
    })

    const typeStr = matchRelation(rel, {
      one: (r) => `${r.name}: ${r.modelName}`,
      many: (r) => `${r.name}: ${r.modelName}[]`
    })

    expect(typeStr).toBe('comments: Comment[]')
    expect(rel.cardinality).toBe('many')
    expect(rel.isCollection).toBe(true)
  })

  test('3. matchRelationType executes exhaustive catamorphism across all 11 Eloquent relation variants', () => {
    const relations = [
      ScannedModelRelationDescriptor.single({ name: 'profile', type: EloquentRelationType.HasOne, modelName: 'Profile', targetModel: 'App\\Models\\Profile' }),
      ScannedModelRelationDescriptor.collection({ name: 'posts', type: EloquentRelationType.HasMany, modelName: 'Post', targetModel: 'App\\Models\\Post' }),
      ScannedModelRelationDescriptor.single({ name: 'author', type: EloquentRelationType.BelongsTo, modelName: 'User', targetModel: 'App\\Models\\User' }),
      ScannedModelRelationDescriptor.collection({ name: 'roles', type: EloquentRelationType.BelongsToMany, modelName: 'Role', targetModel: 'App\\Models\\Role' }),
      ScannedModelRelationDescriptor.single({ name: 'latestDeployment', type: EloquentRelationType.HasOneThrough, modelName: 'Deployment', targetModel: 'App\\Models\\Deployment' }),
      ScannedModelRelationDescriptor.collection({ name: 'deployments', type: EloquentRelationType.HasManyThrough, modelName: 'Deployment', targetModel: 'App\\Models\\Deployment' }),
      ScannedModelRelationDescriptor.single({ name: 'taggable', type: EloquentRelationType.MorphTo, modelName: 'Taggable', targetModel: 'App\\Models\\Taggable' }),
      ScannedModelRelationDescriptor.single({ name: 'image', type: EloquentRelationType.MorphOne, modelName: 'Image', targetModel: 'App\\Models\\Image' }),
      ScannedModelRelationDescriptor.collection({ name: 'images', type: EloquentRelationType.MorphMany, modelName: 'Image', targetModel: 'App\\Models\\Image' }),
      ScannedModelRelationDescriptor.collection({ name: 'tags', type: EloquentRelationType.MorphToMany, modelName: 'Tag', targetModel: 'App\\Models\\Tag' }),
      ScannedModelRelationDescriptor.collection({ name: 'articles', type: EloquentRelationType.MorphedByMany, modelName: 'Article', targetModel: 'App\\Models\\Article' })
    ]

    const labels = relations.map(r => matchRelationType(r, {
      hasOne: (rel) => `hasOne:${rel.name}`,
      hasMany: (rel) => `hasMany:${rel.name}`,
      belongsTo: (rel) => `belongsTo:${rel.name}`,
      belongsToMany: (rel) => `belongsToMany:${rel.name}`,
      hasOneThrough: (rel) => `hasOneThrough:${rel.name}`,
      hasManyThrough: (rel) => `hasManyThrough:${rel.name}`,
      morphTo: (rel) => `morphTo:${rel.name}`,
      morphOne: (rel) => `morphOne:${rel.name}`,
      morphMany: (rel) => `morphMany:${rel.name}`,
      morphToMany: (rel) => `morphToMany:${rel.name}`,
      morphedByMany: (rel) => `morphedByMany:${rel.name}`
    }))

    expect(labels).toEqual([
      'hasOne:profile',
      'hasMany:posts',
      'belongsTo:author',
      'belongsToMany:roles',
      'hasOneThrough:latestDeployment',
      'hasManyThrough:deployments',
      'morphTo:taggable',
      'morphOne:image',
      'morphMany:images',
      'morphToMany:tags',
      'morphedByMany:articles'
    ])
  })

  test('4. ELOQUENT_RELATION_REGISTRY enforces frozen specifications and polymorphic flags', () => {
    expect(Object.isFrozen(ELOQUENT_RELATION_REGISTRY)).toBe(true)

    // Check single vs many
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.HasOne].cardinality).toBe('one')
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.HasOne].isCollection).toBe(false)
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.HasOne].isPolymorphic).toBe(false)

    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.HasMany].cardinality).toBe('many')
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.HasMany].isCollection).toBe(true)
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.HasMany].isPolymorphic).toBe(false)

    // Check polymorphic flags
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.MorphTo].isPolymorphic).toBe(true)
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.MorphOne].isPolymorphic).toBe(true)
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.MorphMany].isPolymorphic).toBe(true)
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.MorphToMany].isPolymorphic).toBe(true)
    expect(ELOQUENT_RELATION_REGISTRY[EloquentRelationType.MorphedByMany].isPolymorphic).toBe(true)

    expect(EloquentRelationClassifier.isPolymorphic(EloquentRelationType.MorphTo)).toBe(true)
    expect(EloquentRelationClassifier.isPolymorphic(EloquentRelationType.BelongsTo)).toBe(false)
  })

  test('5. ScannedModelRelationDescriptor explicit semantic factories create frozen descriptors', () => {
    const singleRel = ScannedModelRelationDescriptor.single({
      name: 'category',
      type: EloquentRelationType.BelongsTo,
      modelName: 'Category',
      targetModel: 'App\\Models\\Category',
      foreignKey: 'category_id'
    })

    const collectionRel = ScannedModelRelationDescriptor.collection({
      name: 'tags',
      type: EloquentRelationType.BelongsToMany,
      modelName: 'Tag',
      targetModel: 'App\\Models\\Tag'
    })

    expect(Object.isFrozen(singleRel)).toBe(true)
    expect(singleRel.foreignKey).toBe('category_id')
    expect(singleRel.cardinality).toBe('one')
    expect(singleRel.isCollection).toBe(false)

    expect(Object.isFrozen(collectionRel)).toBe(true)
    expect(collectionRel.foreignKey).toBeNull()
    expect(collectionRel.cardinality).toBe('many')
    expect(collectionRel.isCollection).toBe(true)
  })
})

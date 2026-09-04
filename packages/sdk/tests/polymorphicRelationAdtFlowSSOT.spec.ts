import { describe, test, expect } from 'vitest'
import {
  matchPolymorphicRelation,
  matchPolymorphicMorphType,
  POLYMORPHIC_RELATION_REGISTRY,
  PolymorphicMorphType,
  PolymorphicRelationDescriptor,
  ScannedPolymorphicRelationDescriptor
} from '../../core/src'

describe('PolymorphicRelationDescriptor ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchPolymorphicRelation executes pure catamorphism for single relations (morphTo, morphOne)', () => {
    const morphToRel = ScannedPolymorphicRelationDescriptor.morphTo(
      ['Post', 'Video'],
      'commentable_id',
      'commentable_type',
      'Commentable'
    )

    const morphToResult = matchPolymorphicRelation(morphToRel, {
      morphTo: (rel) => `MORPH_TO:${rel.unionTypeName}:${rel.targetModels.join('|')}:${rel.isCollection}:${rel.cardinality}`,
      morphOne: () => 'MORPH_ONE',
      morphMany: () => 'MORPH_MANY',
      morphToMany: () => 'MORPH_TO_MANY',
      morphedByMany: () => 'MORPHED_BY_MANY'
    })

    expect(morphToResult).toBe('MORPH_TO:Commentable:Post|Video:false:one')

    const morphOneRel = ScannedPolymorphicRelationDescriptor.morphOne(
      ['Image'],
      'imageable_id',
      'imageable_type',
      'Imageable'
    )

    const morphOneResult = matchPolymorphicRelation(morphOneRel, {
      morphTo: () => 'MORPH_TO',
      morphOne: (rel) => `MORPH_ONE:${rel.unionTypeName}:${rel.idColumn}:${rel.isCollection}:${rel.cardinality}`,
      morphMany: () => 'MORPH_MANY',
      morphToMany: () => 'MORPH_TO_MANY',
      morphedByMany: () => 'MORPHED_BY_MANY'
    })

    expect(morphOneResult).toBe('MORPH_ONE:Imageable:imageable_id:false:one')
  })

  test('2. matchPolymorphicRelation executes pure catamorphism for collection relations (morphMany, morphToMany, morphedByMany)', () => {
    const morphManyRel = ScannedPolymorphicRelationDescriptor.morphMany(
      ['Comment'],
      'commentable_id',
      'commentable_type',
      'Comment'
    )

    const morphManyResult = matchPolymorphicRelation(morphManyRel, {
      morphTo: () => 'N',
      morphOne: () => 'N',
      morphMany: (rel) => `MANY:${rel.unionTypeName}:${rel.isCollection}:${rel.cardinality}`,
      morphToMany: () => 'N',
      morphedByMany: () => 'N'
    })

    expect(morphManyResult).toBe('MANY:Comment:true:many')

    const morphToManyRel = ScannedPolymorphicRelationDescriptor.morphToMany(
      ['Tag'],
      'taggable_id',
      'taggable_type',
      'Taggable'
    )

    const morphToManyResult = matchPolymorphicRelation(morphToManyRel, {
      morphTo: () => 'N',
      morphOne: () => 'N',
      morphMany: () => 'N',
      morphToMany: (rel) => `TO_MANY:${rel.unionTypeName}:${rel.isCollection}:${rel.cardinality}`,
      morphedByMany: () => 'N'
    })

    expect(morphToManyResult).toBe('TO_MANY:Taggable:true:many')

    const morphedByManyRel = ScannedPolymorphicRelationDescriptor.morphedByMany(
      ['Post', 'Video'],
      'taggable_id',
      'taggable_type',
      'TagTarget'
    )

    const morphedByManyResult = matchPolymorphicRelation(morphedByManyRel, {
      morphTo: () => 'N',
      morphOne: () => 'N',
      morphMany: () => 'N',
      morphToMany: () => 'N',
      morphedByMany: (rel) => `BY_MANY:${rel.unionTypeName}:${rel.targetModels.join('&')}:${rel.isCollection}:${rel.cardinality}`
    })

    expect(morphedByManyResult).toBe('BY_MANY:TagTarget:Post&Video:true:many')
  })

  test('3. matchPolymorphicMorphType alias behaves identically to matchPolymorphicRelation', () => {
    const rel = ScannedPolymorphicRelationDescriptor.morphTo(['User'], 'authorable_id', 'authorable_type', 'Authorable')

    const res = matchPolymorphicMorphType(rel, {
      morphTo: (r) => r.unionTypeName,
      morphOne: () => '',
      morphMany: () => '',
      morphToMany: () => '',
      morphedByMany: () => ''
    })

    expect(res).toBe('Authorable')
  })

  test('4. POLYMORPHIC_RELATION_REGISTRY provides frozen O(1) specifications for all 5 variants', () => {
    expect(Object.isFrozen(POLYMORPHIC_RELATION_REGISTRY)).toBe(true)

    const allTypes = Object.values(PolymorphicMorphType)
    expect(allTypes).toHaveLength(5)

    for (const morphType of allTypes) {
      const spec = POLYMORPHIC_RELATION_REGISTRY[morphType]
      expect(spec).toBeDefined()
      expect(spec.morphType).toBe(morphType)
      expect(typeof spec.cardinality).toBe('string')
      expect(typeof spec.isCollection).toBe('boolean')
      expect(typeof spec.defaultIdColumn).toBe('string')
      expect(typeof spec.defaultTypeColumn).toBe('string')
      expect(typeof spec.defaultUnionTypeName).toBe('string')
    }

    expect(POLYMORPHIC_RELATION_REGISTRY[PolymorphicMorphType.MorphTo].cardinality).toBe('one')
    expect(POLYMORPHIC_RELATION_REGISTRY[PolymorphicMorphType.MorphOne].cardinality).toBe('one')
    expect(POLYMORPHIC_RELATION_REGISTRY[PolymorphicMorphType.MorphMany].cardinality).toBe('many')
    expect(POLYMORPHIC_RELATION_REGISTRY[PolymorphicMorphType.MorphToMany].cardinality).toBe('many')
    expect(POLYMORPHIC_RELATION_REGISTRY[PolymorphicMorphType.MorphedByMany].cardinality).toBe('many')
  })

  test('5. ScannedPolymorphicRelationDescriptor.create resolves defaults from registry', () => {
    const defaultPoly = ScannedPolymorphicRelationDescriptor.create()
    expect(defaultPoly.morphType).toBe('morphTo')
    expect(defaultPoly.idColumn).toBe('commentable_id')
    expect(defaultPoly.typeColumn).toBe('commentable_type')
    expect(defaultPoly.targetModels).toEqual([])
    expect(defaultPoly.unionTypeName).toBe('CommentableTarget')
    expect(defaultPoly.isCollection).toBe(false)
    expect(defaultPoly.cardinality).toBe('one')
    expect(Object.isFrozen(defaultPoly)).toBe(true)

    const tagToMany = ScannedPolymorphicRelationDescriptor.create({
      morphType: PolymorphicMorphType.MorphToMany,
      targetModels: ['Tag']
    })
    expect(tagToMany.morphType).toBe('morphToMany')
    expect(tagToMany.idColumn).toBe('taggable_id')
    expect(tagToMany.typeColumn).toBe('taggable_type')
    expect(tagToMany.targetModels).toEqual(['Tag'])
    expect(tagToMany.unionTypeName).toBe('TaggableTarget')
    expect(tagToMany.isCollection).toBe(true)
    expect(tagToMany.cardinality).toBe('many')
  })

  test('6. Semantic factory methods instantiate guaranteed frozen ADT instances', () => {
    const toRel = ScannedPolymorphicRelationDescriptor.morphTo(['A', 'B'])
    expect(toRel.morphType).toBe('morphTo')
    expect(toRel.isCollection).toBe(false)
    expect(toRel.cardinality).toBe('one')
    expect(Object.isFrozen(toRel)).toBe(true)

    const oneRel = ScannedPolymorphicRelationDescriptor.morphOne(['Profile'])
    expect(oneRel.morphType).toBe('morphOne')
    expect(oneRel.isCollection).toBe(false)
    expect(oneRel.cardinality).toBe('one')

    const manyRel = ScannedPolymorphicRelationDescriptor.morphMany(['Comment'])
    expect(manyRel.morphType).toBe('morphMany')
    expect(manyRel.isCollection).toBe(true)
    expect(manyRel.cardinality).toBe('many')

    const toManyRel = ScannedPolymorphicRelationDescriptor.morphToMany(['Tag'])
    expect(toManyRel.morphType).toBe('morphToMany')
    expect(toManyRel.isCollection).toBe(true)
    expect(toManyRel.cardinality).toBe('many')

    const byManyRel = ScannedPolymorphicRelationDescriptor.morphedByMany(['Post'])
    expect(byManyRel.morphType).toBe('morphedByMany')
    expect(byManyRel.isCollection).toBe(true)
    expect(byManyRel.cardinality).toBe('many')
  })

  test('7. Pure functional polymorphic type declaration pipeline without branching (Zero-if pattern)', () => {
    const relations: readonly PolymorphicRelationDescriptor[] = [
      ScannedPolymorphicRelationDescriptor.morphTo(['Post', 'Video'], 'commentable_id', 'commentable_type', 'Commentable'),
      ScannedPolymorphicRelationDescriptor.morphOne(['Image'], 'imageable_id', 'imageable_type', 'Imageable'),
      ScannedPolymorphicRelationDescriptor.morphMany(['Comment'], 'commentable_id', 'commentable_type', 'Comment'),
      ScannedPolymorphicRelationDescriptor.morphToMany(['Tag'], 'taggable_id', 'taggable_type', 'Tag'),
      ScannedPolymorphicRelationDescriptor.morphedByMany(['Post', 'Video'], 'taggable_id', 'taggable_type', 'TaggableContent')
    ]

    const declarations = relations.map(rel => {
      const typeSignature = matchPolymorphicRelation(rel, {
        morphTo: (r) => `${r.unionTypeName} | null`,
        morphOne: (r) => `${r.unionTypeName} | null`,
        morphMany: (r) => `${r.unionTypeName}[]`,
        morphToMany: (r) => `${r.unionTypeName}[]`,
        morphedByMany: (r) => `${r.unionTypeName}[]`
      })

      return `${rel.morphType}: ${typeSignature}`
    })

    expect(declarations).toEqual([
      'morphTo: Commentable | null',
      'morphOne: Imageable | null',
      'morphMany: Comment[]',
      'morphToMany: Tag[]',
      'morphedByMany: TaggableContent[]'
    ])
  })

  test('8. Backward compatibility: supports raw object literals matching PolymorphicRelationDescriptor', () => {
    const rawLiteral: PolymorphicRelationDescriptor = {
      morphType: 'morphTo',
      idColumn: 'commentable_id',
      typeColumn: 'commentable_type',
      targetModels: ['Post', 'Video'],
      unionTypeName: 'CommentableTarget'
    }

    const matched = matchPolymorphicRelation(rawLiteral, {
      morphTo: (r) => `LITERAL:${r.morphType}:${r.unionTypeName}`,
      morphOne: () => '',
      morphMany: () => '',
      morphToMany: () => '',
      morphedByMany: () => ''
    })

    expect(matched).toBe('LITERAL:morphTo:CommentableTarget')
  })
})

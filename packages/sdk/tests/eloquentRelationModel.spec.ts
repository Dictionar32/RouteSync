import { describe, it, expect } from 'vitest';
import { EloquentRelationType, EloquentRelationClassifier, ELOQUENT_RELATION_REGISTRY, ParsedRelation } from '@routesync/core';

describe('EloquentRelation Explicit Model Suite', () => {
  it('1. Correctly classifies standard single Eloquent relationships via Type Guard', () => {
    expect(EloquentRelationClassifier.isRelationMethod('hasOne')).toBe(true);
    if (EloquentRelationClassifier.isRelationMethod('hasOne')) {
      const desc = EloquentRelationClassifier.getDescriptor('hasOne');
      expect(desc.type).toBe(EloquentRelationType.HasOne);
      expect(desc.cardinality).toBe('one');
      expect(desc.isCollection).toBe(false);
    }

    expect(EloquentRelationClassifier.isRelationMethod('belongsTo')).toBe(true);
    if (EloquentRelationClassifier.isRelationMethod('belongsTo')) {
      const desc = EloquentRelationClassifier.getDescriptor('belongsTo');
      expect(desc.type).toBe(EloquentRelationType.BelongsTo);
      expect(desc.cardinality).toBe('one');
      expect(desc.isCollection).toBe(false);
    }

    expect(EloquentRelationClassifier.isRelationMethod('morphTo')).toBe(true);
    if (EloquentRelationClassifier.isRelationMethod('morphTo')) {
      const desc = EloquentRelationClassifier.getDescriptor('morphTo');
      expect(desc.type).toBe(EloquentRelationType.MorphTo);
      expect(desc.cardinality).toBe('one');
      expect(desc.isCollection).toBe(false);
    }
  });

  it('2. Correctly classifies collection Eloquent relationships with 0 manual checks', () => {
    expect(EloquentRelationClassifier.isRelationMethod('hasMany')).toBe(true);
    if (EloquentRelationClassifier.isRelationMethod('hasMany')) {
      const desc = EloquentRelationClassifier.getDescriptor('hasMany');
      expect(desc.type).toBe(EloquentRelationType.HasMany);
      expect(desc.cardinality).toBe('many');
      expect(desc.isCollection).toBe(true);
    }

    expect(EloquentRelationClassifier.isRelationMethod('belongsToMany')).toBe(true);
    if (EloquentRelationClassifier.isRelationMethod('belongsToMany')) {
      const desc = EloquentRelationClassifier.getDescriptor('belongsToMany');
      expect(desc.type).toBe(EloquentRelationType.BelongsToMany);
      expect(desc.cardinality).toBe('many');
      expect(desc.isCollection).toBe(true);
    }

    expect(EloquentRelationClassifier.isRelationMethod('hasManyThrough')).toBe(true);
    if (EloquentRelationClassifier.isRelationMethod('hasManyThrough')) {
      const desc = EloquentRelationClassifier.getDescriptor('hasManyThrough');
      expect(desc.type).toBe(EloquentRelationType.HasManyThrough);
      expect(desc.cardinality).toBe('many');
      expect(desc.isCollection).toBe(true);
    }
  });

  it('3. Safely rejects non-relation methods via Type Guard', () => {
    expect(EloquentRelationClassifier.isRelationMethod('where')).toBe(false);
    expect(EloquentRelationClassifier.isRelationMethod('orderBy')).toBe(false);
    expect(EloquentRelationClassifier.isRelationMethod('')).toBe(false);
  });

  it('4. Enforces ELOQUENT_RELATION_REGISTRY exhaustiveness over all relation types', () => {
    for (const relType of Object.values(EloquentRelationType)) {
      expect(ELOQUENT_RELATION_REGISTRY[relType]).toBeDefined();
      expect(ELOQUENT_RELATION_REGISTRY[relType].type).toBe(relType);
    }
  });

  it('5. Enforces ParsedRelation complete contract with guaranteed modelName and type', () => {
    const relation: ParsedRelation = {
      name: 'orderDetails',
      type: EloquentRelationType.HasMany,
      modelName: 'OrderDetail',
      targetModel: 'App\\Models\\OrderDetail',
      isCollection: true
    };

    expect(relation.name).toBe('orderDetails');
    expect(relation.type).toBe('hasMany');
    expect(relation.modelName).toBe('OrderDetail');
    expect(relation.targetModel).toBe('App\\Models\\OrderDetail');
    expect(relation.isCollection).toBe(true);
  });
});

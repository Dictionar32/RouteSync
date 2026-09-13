import { describe, it, expect } from 'vitest'
import {
  ModelSymbolTable,
  SemanticResourceBinder,
  BoundSemanticNode,
  BoundSemanticFactory,
  matchBoundSemanticNode,
  BoundSemanticVisitor,
  ParsedModel,
  PrimitiveKind
} from '@routesync/core'

describe('Direct Semantic Binding at Origin Boundary & Bound AST SSOT', () => {
  const mockModels: ParsedModel[] = [
    {
      name: 'App\\Models\\Product',
      shortName: 'Product',
      table: 'products',
      primaryKey: 'id',
      keyType: 'int',
      keySemanticType: PrimitiveKind.NUMBER,
      incrementing: true,
      softDeletes: false,
      timestamps: true,
      columns: [
        { name: 'id', type: 'bigint', nullable: false, semanticType: 'number' },
        { name: 'name', type: 'varchar(255)', nullable: false, semanticType: 'string' },
        { name: 'price', type: 'decimal(10,2)', nullable: false, semanticType: 'number' },
        { name: 'category_id', type: 'int', nullable: true, semanticType: 'number' }
      ],
      fillable: ['name', 'price', 'category_id'],
      guarded: [],
      hidden: [],
      appends: [],
      casts: [
        { column: 'price', targetType: 'decimal' }
      ],
      accessors: [],
      relations: [
        {
          name: 'category',
          type: 'belongsTo',
          modelName: 'App\\Models\\Product',
          targetModel: 'Category',
          cardinality: 'one',
          isCollection: false,
          foreignKey: 'category_id'
        }
      ]
    },
    {
      name: 'App\\Models\\Category',
      shortName: 'Category',
      table: 'categories',
      primaryKey: 'id',
      keyType: 'int',
      keySemanticType: PrimitiveKind.NUMBER,
      incrementing: true,
      softDeletes: false,
      timestamps: true,
      columns: [
        { name: 'id', type: 'int', nullable: false, semanticType: 'number' },
        { name: 'title', type: 'varchar(255)', nullable: false, semanticType: 'string' }
      ],
      fillable: ['title'],
      guarded: [],
      hidden: [],
      appends: [],
      casts: [],
      accessors: [],
      relations: []
    }
  ]

  const symbolTable = new ModelSymbolTable(mockModels)

  it('indexes models and resolves columns, casts, and relations in O(1)', () => {
    const productSymbol = symbolTable.findForResource('ProductResource')
    expect(productSymbol).toBeDefined()
    expect(productSymbol?.shortName).toBe('Product')

    const priceBinding = productSymbol?.resolveProperty('price')
    expect(priceBinding).toBeDefined()
    expect(priceBinding?.kind).toBe('column')
    expect(priceBinding?.type).toBe('number')
    expect(priceBinding?.nullable).toBe(false)

    const categoryBinding = productSymbol?.resolveProperty('category')
    expect(categoryBinding).toBeDefined()
    expect(categoryBinding?.kind).toBe('relation')
    expect(categoryBinding?.targetModel).toBe('Category')
    expect(categoryBinding?.isCollection).toBe(false)
  })

  it('binds $this->price directly to frozen BoundModelColumnNode at Origin Boundary', () => {
    const modelSymbol = symbolTable.findForResource('ProductResource')
    const result = SemanticResourceBinder.bindField({
      key: 'price',
      value: { kind: 'property_access', target: '$this', property: 'price', nullsafe: false },
      rawExpression: '$this->price',
      modelSymbol,
      modelSymbolTable: symbolTable
    })

    expect(result.boundAst).toBeDefined()
    expect(Object.isFrozen(result.boundAst)).toBe(true)
    expect(result.boundAst.kind).toBe('bound_model_column')

    if (result.boundAst.kind === 'bound_model_column') {
      expect(result.boundAst.model).toBe('App\\Models\\Product')
      expect(result.boundAst.column).toBe('price')
      expect(result.boundAst.semanticType).toBe('number')
      expect(result.boundAst.nullable).toBe(false)
      expect(result.boundAst.invalidationTags).toEqual(['App\\Models\\Product'])
    }

    expect(result.descriptor.expression.kind).toBe('primitive')
    expect(result.descriptor.semanticType).toBe(PrimitiveKind.NUMBER)
    expect(result.descriptor.nullable).toBe(false)
  })

  it('binds $this->whenLoaded(\'category\') directly to BoundConditionalNode with isOptional: true', () => {
    const modelSymbol = symbolTable.findForResource('ProductResource')
    const result = SemanticResourceBinder.bindField({
      key: 'category',
      value: { kind: 'method_chain', target: '$this', property: 'whenLoaded', nullsafe: false },
      rawExpression: "$this->whenLoaded('category')",
      modelSymbol,
      modelSymbolTable: symbolTable
    })

    expect(result.boundAst).toBeDefined()
    expect(Object.isFrozen(result.boundAst)).toBe(true)
    expect(result.boundAst.kind).toBe('bound_conditional')

    if (result.boundAst.kind === 'bound_conditional') {
      expect(result.boundAst.wrapper).toBe('whenLoaded')
      expect(result.boundAst.isOptional).toBe(true)
      expect(result.boundAst.relationModel).toBe('Category')
      expect(result.boundAst.target.kind).toBe('bound_relation')
      expect(result.boundAst.invalidationTags).toContain('Category')
    }

    expect(result.descriptor.nullable).toBe(true)
  })

  it('binds full Resource array definitions directly into ParsedResource with boundAst attached', () => {
    const resource = SemanticResourceBinder.bindResource({
      resourceName: 'ProductResource',
      entries: [
        {
          key: 'id',
          value: { kind: 'property_access', target: '$this', property: 'id', nullsafe: false },
          rawExpression: '$this->id'
        },
        {
          key: 'price',
          value: { kind: 'property_access', target: '$this', property: 'price', nullsafe: false },
          rawExpression: '$this->price'
        },
        {
          key: 'category',
          value: { kind: 'method_chain', target: '$this', property: 'whenLoaded', nullsafe: false },
          rawExpression: "$this->whenLoaded('category')"
        }
      ],
      sourceFile: '/app/Http/Resources/ProductResource.php',
      modelSymbolTable: symbolTable
    })

    expect(resource.name).toBe('ProductResource')
    expect(resource.fields).toHaveLength(3)

    const idField = resource.fields.find(f => f.name === 'id')
    expect(idField?.boundAst?.kind).toBe('bound_model_column')

    const categoryField = resource.fields.find(f => f.name === 'category')
    expect(categoryField?.boundAst?.kind).toBe('bound_conditional')
    expect(categoryField?.nullable).toBe(true)
  })

  it('pure catamorphism matchBoundSemanticNode folds AST variants with 0 if/switch', () => {
    const visitor: BoundSemanticVisitor<string> = {
      bound_primitive: (n) => `primitive(${n.semanticType})`,
      bound_model_column: (n) => `column(${n.model}.${n.column}:${n.semanticType})`,
      bound_relation: (n) => `relation(${n.sourceModel}->${n.relationName}:${n.targetModel})`,
      bound_property_chain: (n) => `chain(${n.rootModel}.${n.steps.map(s => s.property).join('.')})`,
      bound_conditional: (n) => `conditional(${n.wrapper}:${matchBoundSemanticNode(n.target, visitor)})`,
      bound_binary: (n) => `binary(${matchBoundSemanticNode(n.left, visitor)} ${n.operator} ${matchBoundSemanticNode(n.right, visitor)})`,
      bound_ternary: (n) => `ternary(? ${matchBoundSemanticNode(n.truthy, visitor)} : ${matchBoundSemanticNode(n.falsy, visitor)})`,
      bound_method_call: (n) => `method(${n.targetModel}.${n.methodName})`,
      bound_unknown: (n) => `unknown(${n.rawExpression})`
    }

    const columnNode = BoundSemanticFactory.modelColumn({
      model: 'Product',
      column: 'price',
      dbType: 'decimal',
      castType: 'decimal',
      semanticType: 'number',
      nullable: false
    })

    const conditionalNode = BoundSemanticFactory.conditional({
      wrapper: 'whenLoaded',
      conditionExpression: 'relation:category',
      target: columnNode,
      relationModel: 'Category',
      isOptional: true
    })

    const formatted = matchBoundSemanticNode(conditionalNode, visitor)
    expect(formatted).toBe('conditional(whenLoaded:column(Product.price:number))')
  })
})

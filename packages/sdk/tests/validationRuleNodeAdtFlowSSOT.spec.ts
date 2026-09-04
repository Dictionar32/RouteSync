import { describe, test, expect } from 'vitest'
import {
  VALIDATION_RULE_REGISTRY,
  matchValidationRule,
  matchRule,
  ValidationRuleNodeFactory,
  ValidationRuleKind,
  ValidationRuleNode,
  ValidationRuleVisitor
} from '../../core/src'

describe('ValidationRuleNode ADT Flow SSOT (Zero-if Catamorphism Suite)', () => {
  test('1. matchValidationRule executes catamorphism on modifier rules without if/switch', () => {
    const req = ValidationRuleNodeFactory.required()
    const nullNode = ValidationRuleNodeFactory.nullable()
    const opt = ValidationRuleNodeFactory.optional()

    const visitor: ValidationRuleVisitor<string> = {
      required: () => 'MODIFIER:REQUIRED',
      nullable: () => 'MODIFIER:NULLABLE',
      optional: () => 'MODIFIER:OPTIONAL',
      string: () => 'TYPE:STRING',
      number: () => 'TYPE:NUMBER',
      boolean: () => 'TYPE:BOOLEAN',
      array: (a) => `TYPE:ARRAY<${a.elementType ?? 'any'}>`,
      email: () => 'FORMAT:EMAIL',
      url: () => 'FORMAT:URL',
      uuid: () => 'FORMAT:UUID',
      date: (d) => `FORMAT:DATE(${d.format ?? 'iso'})`,
      min: (m) => `CONSTRAINT:MIN(${m.value})`,
      max: (m) => `CONSTRAINT:MAX(${m.value})`,
      between: (b) => `CONSTRAINT:BETWEEN(${b.min},${b.max})`,
      in: (i) => `CONSTRAINT:IN(${i.values.join(',')})`,
      exists: (e) => `DB:EXISTS(${e.table}.${e.column ?? 'id'})`,
      unique: (u) => `DB:UNIQUE(${u.table}.${u.column ?? 'id'})`,
      file: () => 'TYPE:FILE',
      image: () => 'TYPE:IMAGE',
      custom: (c) => `CUSTOM:${c.rule}(${c.parameters.join(',')})`
    }

    expect(matchValidationRule(req, visitor)).toBe('MODIFIER:REQUIRED')
    expect(matchValidationRule(nullNode, visitor)).toBe('MODIFIER:NULLABLE')
    expect(matchValidationRule(opt, visitor)).toBe('MODIFIER:OPTIONAL')
  })

  test('2. matchValidationRule executes catamorphism on type assertion rules', () => {
    const visitor: ValidationRuleVisitor<string> = {
      required: () => 'req',
      nullable: () => 'null',
      optional: () => 'opt',
      string: () => 'str',
      number: () => 'num',
      boolean: () => 'bool',
      array: (a) => `arr<${a.elementType ?? 'item'}>`,
      email: () => 'email',
      url: () => 'url',
      uuid: () => 'uuid',
      date: () => 'date',
      min: () => 'min',
      max: () => 'max',
      between: () => 'btw',
      in: () => 'in',
      exists: () => 'exists',
      unique: () => 'unique',
      file: () => 'file',
      image: () => 'image',
      custom: () => 'custom'
    }

    expect(matchValidationRule(ValidationRuleNodeFactory.string(), visitor)).toBe('str')
    expect(matchValidationRule(ValidationRuleNodeFactory.number(), visitor)).toBe('num')
    expect(matchValidationRule(ValidationRuleNodeFactory.boolean(), visitor)).toBe('bool')
    expect(matchValidationRule(ValidationRuleNodeFactory.array('string'), visitor)).toBe('arr<string>')
    expect(matchValidationRule(ValidationRuleNodeFactory.file(), visitor)).toBe('file')
    expect(matchValidationRule(ValidationRuleNodeFactory.image(), visitor)).toBe('image')
  })

  test('3. matchValidationRule executes catamorphism on format rules', () => {
    const visitor: ValidationRuleVisitor<string> = {
      required: () => 'req',
      nullable: () => 'null',
      optional: () => 'opt',
      string: () => 'str',
      number: () => 'num',
      boolean: () => 'bool',
      array: () => 'arr',
      email: () => 'fmt:email',
      url: () => 'fmt:url',
      uuid: () => 'fmt:uuid',
      date: (d) => `fmt:date:${d.format ?? 'default'}`,
      min: () => 'min',
      max: () => 'max',
      between: () => 'btw',
      in: () => 'in',
      exists: () => 'exists',
      unique: () => 'unique',
      file: () => 'file',
      image: () => 'image',
      custom: () => 'custom'
    }

    expect(matchValidationRule(ValidationRuleNodeFactory.email(), visitor)).toBe('fmt:email')
    expect(matchValidationRule(ValidationRuleNodeFactory.url(), visitor)).toBe('fmt:url')
    expect(matchValidationRule(ValidationRuleNodeFactory.uuid(), visitor)).toBe('fmt:uuid')
    expect(matchValidationRule(ValidationRuleNodeFactory.date('Y-m-d'), visitor)).toBe('fmt:date:Y-m-d')
  })

  test('4. matchValidationRule executes catamorphism on constraint rules', () => {
    const visitor: ValidationRuleVisitor<string> = {
      required: () => 'req',
      nullable: () => 'null',
      optional: () => 'opt',
      string: () => 'str',
      number: () => 'num',
      boolean: () => 'bool',
      array: () => 'arr',
      email: () => 'email',
      url: () => 'url',
      uuid: () => 'uuid',
      date: () => 'date',
      min: (m) => `>=${m.value}`,
      max: (m) => `<=${m.value}`,
      between: (b) => `[${b.min}..${b.max}]`,
      in: (i) => `in(${i.values.join('|')})`,
      exists: () => 'exists',
      unique: () => 'unique',
      file: () => 'file',
      image: () => 'image',
      custom: () => 'custom'
    }

    expect(matchValidationRule(ValidationRuleNodeFactory.min(5), visitor)).toBe('>=5')
    expect(matchValidationRule(ValidationRuleNodeFactory.max(100), visitor)).toBe('<=100')
    expect(matchValidationRule(ValidationRuleNodeFactory.between(1, 10), visitor)).toBe('[1..10]')
    expect(matchValidationRule(ValidationRuleNodeFactory.in(['active', 'pending']), visitor)).toBe('in(active|pending)')
  })

  test('5. matchValidationRule executes catamorphism on database and custom rules', () => {
    const visitor: ValidationRuleVisitor<string> = {
      required: () => 'req',
      nullable: () => 'null',
      optional: () => 'opt',
      string: () => 'str',
      number: () => 'num',
      boolean: () => 'bool',
      array: () => 'arr',
      email: () => 'email',
      url: () => 'url',
      uuid: () => 'uuid',
      date: () => 'date',
      min: () => 'min',
      max: () => 'max',
      between: () => 'btw',
      in: () => 'in',
      exists: (e) => `EXISTS in ${e.table}.${e.column ?? 'id'}`,
      unique: (u) => `UNIQUE in ${u.table}.${u.column ?? 'id'}`,
      file: () => 'file',
      image: () => 'image',
      custom: (c) => `CUSTOM ${c.rule}: [${c.parameters.join(', ')}]`
    }

    expect(matchValidationRule(ValidationRuleNodeFactory.exists('users', 'email'), visitor)).toBe('EXISTS in users.email')
    expect(matchValidationRule(ValidationRuleNodeFactory.unique('posts', 'slug'), visitor)).toBe('UNIQUE in posts.slug')
    expect(matchValidationRule(ValidationRuleNodeFactory.custom('phone_number', ['id_ID']), visitor)).toBe('CUSTOM phone_number: [id_ID]')
  })

  test('6. matchRule alias is identical to matchValidationRule', () => {
    expect(matchRule).toBe(matchValidationRule)
    const rule = ValidationRuleNodeFactory.email()
    const result = matchRule(rule, {
      required: () => 'other',
      nullable: () => 'other',
      optional: () => 'other',
      string: () => 'other',
      number: () => 'other',
      boolean: () => 'other',
      array: () => 'other',
      email: () => 'matched_email',
      url: () => 'other',
      uuid: () => 'other',
      date: () => 'other',
      min: () => 'other',
      max: () => 'other',
      between: () => 'other',
      in: () => 'other',
      exists: () => 'other',
      unique: () => 'other',
      file: () => 'other',
      image: () => 'other',
      custom: () => 'other'
    })
    expect(result).toBe('matched_email')
  })

  test('7. VALIDATION_RULE_REGISTRY provides frozen O(1) specifications for all 20 variants', () => {
    expect(Object.isFrozen(VALIDATION_RULE_REGISTRY)).toBe(true)

    const allKinds: readonly ValidationRuleKind[] = Object.values(ValidationRuleKind)
    expect(allKinds.length).toBe(20)

    for (const kind of allKinds) {
      const spec = VALIDATION_RULE_REGISTRY[kind]
      expect(spec).toBeDefined()
      expect(spec.kind).toBe(kind)
      expect(typeof spec.category).toBe('string')
      expect(typeof spec.isTypeAssertion).toBe('boolean')
      expect(typeof spec.isConstraint).toBe('boolean')
      expect(typeof spec.isModifier).toBe('boolean')
      expect(typeof spec.description).toBe('string')
    }

    // Verify modifiers
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Required].isModifier).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Nullable].isModifier).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Optional].isModifier).toBe(true)

    // Verify type assertions
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.String].isTypeAssertion).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Number].isTypeAssertion).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Boolean].isTypeAssertion).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Array].isTypeAssertion).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.File].isTypeAssertion).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Image].isTypeAssertion).toBe(true)

    // Verify constraints / formats / db
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Min].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Max].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Between].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.In].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Email].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Url].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Uuid].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Date].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Exists].isConstraint).toBe(true)
    expect(VALIDATION_RULE_REGISTRY[ValidationRuleKind.Unique].isConstraint).toBe(true)
  })

  test('8. ValidationRuleNodeFactory creates frozen instances with guaranteed properties', () => {
    const minNode = ValidationRuleNodeFactory.min(10)
    expect(Object.isFrozen(minNode)).toBe(true)
    expect(minNode.kind).toBe('min')
    expect(minNode.value).toBe(10)

    const inNode = ValidationRuleNodeFactory.in(['draft', 'published'])
    expect(Object.isFrozen(inNode)).toBe(true)
    expect(Object.isFrozen(inNode.values)).toBe(true)
    expect(inNode.values).toEqual(['draft', 'published'])

    const customNode = ValidationRuleNodeFactory.custom('regex', ['^[a-z]+$'])
    expect(Object.isFrozen(customNode)).toBe(true)
    expect(Object.isFrozen(customNode.parameters)).toBe(true)
    expect(customNode.rule).toBe('regex')
  })

  test('9. Zero-if pipeline transformation over rule nodes', () => {
    const rules: readonly ValidationRuleNode[] = [
      ValidationRuleNodeFactory.required(),
      ValidationRuleNodeFactory.string(),
      ValidationRuleNodeFactory.min(3),
      ValidationRuleNodeFactory.max(50),
      ValidationRuleNodeFactory.unique('users', 'username')
    ]

    // Map to category labels using O(1) registry
    const categories = rules.map((r) => VALIDATION_RULE_REGISTRY[r.kind].category)
    expect(categories).toEqual(['modifier', 'type', 'constraint', 'constraint', 'database'])

    // Filter constraints using zero-if predicate via spec
    const constraintsOnly = rules.filter((r) => VALIDATION_RULE_REGISTRY[r.kind].isConstraint)
    expect(constraintsOnly.map((r) => r.kind)).toEqual(['min', 'max', 'unique'])

    // Catamorphic summarizer
    const summary = rules.map((r) =>
      matchValidationRule(r, {
        required: () => 'required',
        nullable: () => 'nullable',
        optional: () => 'optional',
        string: () => 'string',
        number: () => 'number',
        boolean: () => 'boolean',
        array: () => 'array',
        email: () => 'email',
        url: () => 'url',
        uuid: () => 'uuid',
        date: () => 'date',
        min: (m) => `min:${m.value}`,
        max: (m) => `max:${m.value}`,
        between: (b) => `between:${b.min},${b.max}`,
        in: (i) => `in:${i.values.join(',')}`,
        exists: (e) => `exists:${e.table}`,
        unique: (u) => `unique:${u.table}`,
        file: () => 'file',
        image: () => 'image',
        custom: (c) => `custom:${c.rule}`
      })
    )

    expect(summary).toEqual(['required', 'string', 'min:3', 'max:50', 'unique:users'])
  })
})

import { describe, it, expect } from 'vitest';
import {
    ScannedModelDescriptor,
    ScannedModelRelationDescriptor,
    ScannedModelColumnDescriptor,
    ScannedModelCastDescriptor,
    ScannedModelAccessorDescriptor,
    ScannedControllerActionDescriptor,
    ScannedFormFieldDescriptor,
    ScannedFormActionDescriptor,
    ScannedRequestTypeDescriptor,
    ResourceResponseDescriptor,
    DatabaseColumnKind,
    EloquentRelationType,
    EloquentCastKind,
    PrimitiveKind,
    ValidationRuleNodeFactory
} from '../../core/src';
import { PrimitiveType } from '../../core/src/compiler/types/SemanticType';

describe('Complete Contract & Semantic Factory Pattern SSOT (modelDescriptors & requestDescriptors)', () => {
    describe('1. ScannedModelCastDescriptor', () => {
        it('assigns all parameters directly and freezes instance', () => {
            const descriptor = new ScannedModelCastDescriptor({
                column: 'price',
                targetType: 'decimal:2',
                castKind: EloquentCastKind.Float,
                semanticType: PrimitiveKind.NUMBER
            });

            expect(descriptor.column).toBe('price');
            expect(descriptor.targetType).toBe('decimal:2');
            expect(descriptor.castKind).toBe(EloquentCastKind.Float);
            expect(descriptor.semanticType).toBe(PrimitiveKind.NUMBER);
            expect(Object.isFrozen(descriptor)).toBe(true);
        });

        it('supports static semantic factory .create() and .fromMapping()', () => {
            const created = ScannedModelCastDescriptor.create({
                column: 'is_active',
                targetType: 'boolean'
            });
            expect(created.column).toBe('is_active');
            expect(created.castKind).toBe(EloquentCastKind.Boolean);
            expect(created.semanticType).toBe(PrimitiveKind.BOOLEAN);

            const mapped = ScannedModelCastDescriptor.fromMapping('payload', 'array');
            expect(mapped.column).toBe('payload');
            expect(mapped.targetType).toBe('array');
            expect(mapped.castKind).toBe(EloquentCastKind.Array);
        });
    });

    describe('2. ScannedModelRelationDescriptor', () => {
        it('assigns all parameters directly without fallback', () => {
            const descriptor = new ScannedModelRelationDescriptor({
                name: 'orders',
                type: EloquentRelationType.HasMany,
                modelName: 'User',
                targetModel: 'Order',
                cardinality: 'many',
                isCollection: true,
                foreignKey: 'user_id'
            });

            expect(descriptor.name).toBe('orders');
            expect(descriptor.type).toBe(EloquentRelationType.HasMany);
            expect(descriptor.modelName).toBe('User');
            expect(descriptor.targetModel).toBe('Order');
            expect(descriptor.cardinality).toBe('many');
            expect(descriptor.isCollection).toBe(true);
            expect(descriptor.foreignKey).toBe('user_id');
            expect(Object.isFrozen(descriptor)).toBe(true);
        });

        it('provides semantic factories .single(), .collection(), and .none()', () => {
            const single = ScannedModelRelationDescriptor.single({
                name: 'user',
                type: EloquentRelationType.BelongsTo,
                modelName: 'Order',
                targetModel: 'User',
                foreignKey: 'user_id'
            });
            expect(single.name).toBe('user');
            expect(single.type).toBe(EloquentRelationType.BelongsTo);
            expect(single.foreignKey).toBe('user_id');
            expect(single.cardinality).toBe('one');
            expect(single.isCollection).toBe(false);

            const coll = ScannedModelRelationDescriptor.collection({
                name: 'items',
                type: EloquentRelationType.HasMany,
                modelName: 'Order',
                targetModel: 'OrderItem',
                foreignKey: 'order_id'
            });
            expect(coll.name).toBe('items');
            expect(coll.type).toBe(EloquentRelationType.HasMany);
            expect(coll.cardinality).toBe('many');
            expect(coll.isCollection).toBe(true);

            const none = ScannedModelRelationDescriptor.none();
            expect(none.name).toBe('none');
            expect(none.cardinality).toBe('one');
            expect(none.foreignKey).toBeNull();
        });
    });

    describe('3. ScannedModelColumnDescriptor', () => {
        it('assigns all parameters directly and provides .primaryKey() and .string() factories', () => {
            const pk = ScannedModelColumnDescriptor.primaryKey('id');
            expect(pk.name).toBe('id');
            expect(pk.type).toBe('bigint');
            expect(pk.columnKind).toBe(DatabaseColumnKind.BigInt);
            expect(pk.nullable).toBe(false);
            expect(pk.enumValues).toEqual([]);
            expect(Object.isFrozen(pk)).toBe(true);

            const strCol = ScannedModelColumnDescriptor.string('title', false);
            expect(strCol.name).toBe('title');
            expect(strCol.type).toBe('varchar');
            expect(strCol.columnKind).toBe(DatabaseColumnKind.String);
            expect(strCol.nullable).toBe(false);

            const enumCol = ScannedModelColumnDescriptor.create({
                name: 'status',
                type: 'enum',
                columnKind: DatabaseColumnKind.Enum,
                nullable: false,
                enumValues: ['pending', 'completed']
            });
            expect(enumCol.enumValues).toEqual(['pending', 'completed']);
            expect(Object.isFrozen(enumCol.enumValues)).toBe(true);
        });
    });

    describe('4. ScannedModelAccessorDescriptor', () => {
        it('assigns all parameters directly and freezes descriptor', () => {
            const accessor = ScannedModelAccessorDescriptor.fromReturnType({
                name: 'fullName',
                propertyName: 'full_name',
                type: 'string'
            });

            expect(accessor.name).toBe('fullName');
            expect(accessor.propertyName).toBe('full_name');
            expect(accessor.type).toBe('string');
            expect(accessor.semanticType).toBe(PrimitiveKind.STRING);
            expect(Object.isFrozen(accessor)).toBe(true);
        });
    });

    describe('5. ScannedModelDescriptor', () => {
        it('assigns complete contract directly in constructor', () => {
            const col = ScannedModelColumnDescriptor.primaryKey('id');
            const model = new ScannedModelDescriptor({
                name: 'Product',
                shortName: 'Product',
                table: 'products',
                primaryKey: 'id',
                keyType: 'int',
                keySemanticType: PrimitiveKind.NUMBER,
                incrementing: true,
                softDeletes: false,
                timestamps: true,
                columns: [col],
                fillable: [],
                guarded: ['*'],
                hidden: [],
                appends: [],
                casts: [],
                accessors: [],
                relations: []
            });

            expect(model.name).toBe('Product');
            expect(model.table).toBe('products');
            expect(model.primaryKey).toBe('id');
            expect(model.softDeletes).toBe(false);
            expect(model.timestamps).toBe(true);
            expect(model.columns.length).toBe(1);
            expect(Object.isFrozen(model)).toBe(true);
        });

        it('resolves defaults at Origin Boundary via .create() and .fromTable()', () => {
            const model = ScannedModelDescriptor.create({
                name: 'App\\Models\\OrderItem'
            });

            expect(model.table).toBe('order_items');
            expect(model.primaryKey).toBe('id');
            expect(model.softDeletes).toBe(false);
            expect(model.timestamps).toBe(false);
            expect(Object.isFrozen(model.columns)).toBe(true);
            expect(Object.isFrozen(model.relations)).toBe(true);
            expect(Object.isFrozen(model.casts)).toBe(true);
            expect(Object.isFrozen(model.accessors)).toBe(true);

            const fromTable = ScannedModelDescriptor.fromTable('categories', 'Category');
            expect(fromTable.name).toBe('Category');
            expect(fromTable.table).toBe('categories');
            expect(fromTable.columns.length).toBe(1); // auto primaryKey('id')

            const empty = ScannedModelDescriptor.empty('EmptyModel');
            expect(empty.name).toBe('EmptyModel');
            expect(empty.columns.length).toBe(0);
        });
    });

    describe('6. ScannedControllerActionDescriptor', () => {
        it('assigns all parameters directly and provides .empty() factory', () => {
            const action = ScannedControllerActionDescriptor.create({
                controllerName: 'ProductController',
                actionName: 'store',
                sourceFile: 'app/Http/Controllers/ProductController.php',
                sourceLine: 42,
                response: new ResourceResponseDescriptor({ resourceName: 'ProductResource', shape: 'single' })
            });

            expect(action.controllerName).toBe('ProductController');
            expect(action.actionName).toBe('store');
            expect(action.sourceLine).toBe(42);
            expect(Object.isFrozen(action)).toBe(true);
            expect(Object.isFrozen(action.formRequests)).toBe(true);
            expect(Object.isFrozen(action.schemaRules)).toBe(true);

            const empty = ScannedControllerActionDescriptor.empty('SiteController', 'home', 'app/Http/Controllers/SiteController.php');
            expect(empty.controllerName).toBe('SiteController');
            expect(empty.actionName).toBe('home');
            expect(empty.formRequests.length).toBe(0);
            expect(empty.schemaRules.length).toBe(0);
        });
    });

    describe('7. ScannedFormFieldDescriptor', () => {
        it('assigns all parameters directly without ternary or fallback', () => {
            const rule = ValidationRuleNodeFactory.required();
            const field = new ScannedFormFieldDescriptor({
                name: 'firstName',
                originalName: 'first_name',
                type: new PrimitiveType(PrimitiveKind.STRING),
                required: true,
                nullable: false,
                validationAst: [rule],
                fileConstraints: undefined
            });

            expect(field.transformedName).toBe('firstName');
            expect(field.originalName).toBe('first_name');
            expect(field.required).toBe(true);
            expect(field.nullable).toBe(false);
            expect(field.validationAst?.length).toBe(1);
            expect(field.fileConstraints).toBeUndefined();
            expect(Object.isFrozen(field)).toBe(true);
        });

        it('provides semantic factories .required(), .optional(), and .file()', () => {
            const req = ScannedFormFieldDescriptor.required('email', new PrimitiveType(PrimitiveKind.STRING));
            expect(req.transformedName).toBe('email');
            expect(req.required).toBe(true);
            expect(req.nullable).toBe(false);

            const opt = ScannedFormFieldDescriptor.optional('bio', new PrimitiveType(PrimitiveKind.STRING));
            expect(opt.required).toBe(false);
            expect(opt.nullable).toBe(true);

            const fileField = ScannedFormFieldDescriptor.file('avatar', {
                image: true,
                maxBytes: 2048
            });
            expect(fileField.transformedName).toBe('avatar');
            expect(fileField.required).toBe(true);
            expect(fileField.fileConstraints?.image).toBe(true);
            expect(fileField.fileConstraints?.maxBytes).toBe(2048);
            expect(Object.isFrozen(fileField.fileConstraints)).toBe(true);
        });
    });

    describe('8. ScannedFormActionDescriptor', () => {
        it('assigns fields directly and freezes at factory', () => {
            const field = ScannedFormFieldDescriptor.required('title', new PrimitiveType(PrimitiveKind.STRING));
            const action = ScannedFormActionDescriptor.create({
                name: 'create',
                fields: [field]
            });

            expect(action.name).toBe('create');
            expect(action.fields.length).toBe(1);
            expect(Object.isFrozen(action.fields)).toBe(true);
            expect(Object.isFrozen(action)).toBe(true);

            const empty = ScannedFormActionDescriptor.empty('update');
            expect(empty.name).toBe('update');
            expect(empty.fields.length).toBe(0);
        });
    });

    describe('9. ScannedRequestTypeDescriptor', () => {
        it('assigns complete contract directly and freezes at factory', () => {
            const action = ScannedFormActionDescriptor.empty('create');
            const reqType = ScannedRequestTypeDescriptor.create({
                resourceName: 'posts',
                actions: [action],
                responseData: {
                    resourceName: 'PostResource',
                    fields: { id: new PrimitiveType(PrimitiveKind.NUMBER) }
                }
            });

            expect(reqType.resourceName).toBe('posts');
            expect(reqType.formTypeName).toBe('PostsForm');
            expect(reqType.actions.length).toBe(1);
            expect(reqType.responseData?.resourceName).toBe('PostResource');
            expect(Object.isFrozen(reqType)).toBe(true);
            expect(Object.isFrozen(reqType.actions)).toBe(true);
            expect(Object.isFrozen(reqType.responseData)).toBe(true);

            const empty = ScannedRequestTypeDescriptor.empty('comments');
            expect(empty.resourceName).toBe('comments');
            expect(empty.formTypeName).toBe('CommentsForm');
            expect(empty.actions.length).toBe(0);
            expect(empty.responseData).toBeUndefined();
        });
    });
});

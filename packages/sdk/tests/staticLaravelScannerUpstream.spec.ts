import { describe, it, expect } from 'vitest';
import {
  StaticLaravelScanner,
  ValidationRuleParser,
  ValidationRuleKind,
  InValidationRuleNode,
  UniqueValidationRuleNode,
  ExistsValidationRuleNode
} from '@routesync/core';

describe('StaticLaravelScanner Upstream Enhancements (Pillars A, B, C, D)', () => {
  describe('Pilar A: Laravel 11 casts(): array & Modern Casts', () => {
    it('scans Laravel 11 casts(): array method returning modern casts and class references', () => {
      const modelSource = `<?php
namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use App\\Enums\\OrderStatus;

class Order extends Model
{
    protected $fillable = ['status', 'metadata', 'items_count', 'is_paid'];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'metadata' => 'asarrayobject',
            'items_count' => 'int',
            'is_paid' => 'boolean',
            'secret' => 'hashed',
        ];
    }
}
`;
      const scanner = StaticLaravelScanner.create({ projectRoot: '/fake/root' });
      // Call parseModelFile directly via instance method reflection
      const model = (scanner as any).parseModelFile(modelSource, 'Order');

      expect(model.name).toBe('Order');
      expect(model.casts).toBeDefined();
      expect(model.casts.length).toBeGreaterThanOrEqual(5);

      const statusCast = model.casts.find((c: any) => c.column === 'status');
      expect(statusCast).toBeDefined();
      expect(statusCast.targetType).toBe('OrderStatus');

      const metaCast = model.casts.find((c: any) => c.column === 'metadata');
      expect(metaCast).toBeDefined();
      expect(metaCast.targetType).toBe('asarrayobject');

      const itemsCast = model.casts.find((c: any) => c.column === 'items_count');
      expect(itemsCast).toBeDefined();
      expect(itemsCast.targetType).toBe('int');

      const paidCast = model.casts.find((c: any) => c.column === 'is_paid');
      expect(paidCast).toBeDefined();
      expect(paidCast.targetType).toBe('boolean');

      const secretCast = model.casts.find((c: any) => c.column === 'secret');
      expect(secretCast).toBeDefined();
      expect(secretCast.targetType).toBe('hashed');
    });
  });

  describe('Pilar C: Fluent Validation Rules (Rule::in, Rule::unique, Rule::exists)', () => {
    it('parses Rule::in with string and number array values', () => {
      const rule = ValidationRuleParser.parse("Rule::in(['pending', 'processing', 'completed'])");
      expect(rule.kind).toBe(ValidationRuleKind.In);
      const inRule = rule as InValidationRuleNode;
      expect(inRule.values).toEqual(['pending', 'processing', 'completed']);
    });

    it("parses Rule::unique('orders', 'tracking_number')", () => {
      const rule = ValidationRuleParser.parse("Rule::unique('orders', 'tracking_number')");
      expect(rule.kind).toBe(ValidationRuleKind.Unique);
      const uniqueRule = rule as UniqueValidationRuleNode;
      expect(uniqueRule.table).toBe('orders');
      expect(uniqueRule.column).toBe('tracking_number');
    });

    it("parses Rule::exists('users', 'id')", () => {
      const rule = ValidationRuleParser.parse("Rule::exists('users', 'id')");
      expect(rule.kind).toBe(ValidationRuleKind.Exists);
      const existsRule = rule as ExistsValidationRuleNode;
      expect(existsRule.table).toBe('users');
      expect(existsRule.column).toBe('id');
    });
  });
});

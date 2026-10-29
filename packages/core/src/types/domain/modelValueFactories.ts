import { SemanticValueFactory, type ColumnName, type ModelName, type PropertyName, type TableName } from './semanticValues';
import type { IndexName } from '../upstream/names';

export function createModelName(value: string): ModelName { return SemanticValueFactory.modelName(value); }
export function createTableName(value: string): TableName { return SemanticValueFactory.tableName(value); }
export function createColumnName(value: string): ColumnName { return SemanticValueFactory.columnName(value); }
export function createPropertyName(value: string): PropertyName { return SemanticValueFactory.propertyName(value); }

export const createIndexName = (value: string): IndexName => Object.freeze({ kind: 'index_name' as const, value: { kind: 'string_value' as const, value } });

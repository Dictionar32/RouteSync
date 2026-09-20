import { SemanticValueFactory, type ColumnName, type ModelName, type PropertyName, type TableName } from './semanticValues';

export function createModelName(value: string): ModelName { return SemanticValueFactory.modelName(value); }
export function createTableName(value: string): TableName { return SemanticValueFactory.tableName(value); }
export function createColumnName(value: string): ColumnName { return SemanticValueFactory.columnName(value); }
export function createPropertyName(value: string): PropertyName { return SemanticValueFactory.propertyName(value); }

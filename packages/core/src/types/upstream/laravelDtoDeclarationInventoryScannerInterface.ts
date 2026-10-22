import type { SourceProjectIdentity } from './highLevelSourceModel';
import type { LaravelProjectDtoDeclarationInventoryInterface } from './laravelControllerResponseDtoDeclarationInterface';

/** Discovery contract returning the existing complete-or-incomplete DTO inventory judgment. */
export interface LaravelDtoDeclarationInventoryScannerInterface {
  readonly kind: 'laravel_dto_declaration_inventory_scanner';
  readonly closed: true;
  readonly contractVersion: 1;
  readonly scan: (sourceProject: SourceProjectIdentity) => Promise<LaravelProjectDtoDeclarationInventoryInterface>;
}

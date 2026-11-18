export interface ModuleRolePermissionRequest {
  roleId: number;
  canUpdate: boolean;
  canAdd: boolean;
  canDelete: boolean;
  canAuthorize: boolean;
  canViewTechnicalDetail: boolean;
}
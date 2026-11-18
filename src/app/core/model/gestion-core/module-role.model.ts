export interface ModuleRole {
  roleId: number;
  name: string;
  canUpdate?: boolean;
  canAdd?: boolean;
  canDelete?: boolean;
  canAuthorize?: boolean;
  canViewTechnicalDetail?: boolean;
}
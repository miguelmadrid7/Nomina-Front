export interface CreateRoleRequest {
  name: string;
  description?: string | null;
  parentId?: number | null;
  permissionId?: number | null;
  modulesId?: number[];
}
export interface Role {
  id: number;
  name: string;
  description?: string;
  modulesName?: string;
  modulesname?: string;
  modules?: { id: number; name: string }[];
  parentName?: string;
  parentId?: number | null;
  permissionId?: number | null;
}
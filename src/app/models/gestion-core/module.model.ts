export interface ModuleItem {
  id?: number;
  name: string;
  description?: string | null;
  vista?: boolean;
  visible?: boolean;
  parent?: string | null;
  parentId?: number | null;
  
  icon?: string | null;
  iconId?: number | null;
  path?: string | null;
  roles?: ModuleRole[];
  rolesId?: number[];
}

export interface ModuleRole {
  id: number;
  name: string;
}

export interface ModuleRequest {
  name: string;
  path: string;
  description?: string | null;
  visible: boolean;
  iconId?: number | null;
  parentId?: number | null;
  rolesId: number[];
}

export interface ModuleDialogData {
  mode: 'create' | 'edit';
  module?: ModuleItem;
}

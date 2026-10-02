export interface SidebarModule {
  moduleId: number;
  moduleName: string;
  description: string | null;
  config: string | null;
  path: string | null;
  parentId: number | null;
  parentName: string | null;
  icon: string | null;
  vista: boolean;
}

export interface SidebarGroup {
  parentId: number | null;
  parentName: string;
  icon: string;
  expanded:   boolean;
  children: SidebarModule[];
}

export interface SidebarNode {
  id: number;
  name: string;
  icon: string;
  route: string | null;   // null = agrupador
  children: SidebarNode[];
}
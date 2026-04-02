export interface ModuleCacheTags {
  root: string;
  list: string;
  item: (id: string) => string;
  slice: (dimension: string, value: string) => string;
}

export interface ModuleQueryKeys {
  root: readonly ['module', string];
  list: (
    params?: Record<string, unknown>
  ) => readonly ['module', string, 'list', Record<string, unknown>];
  item: (id: string) => readonly ['module', string, 'item', string];
}

export interface ModuleDirectoryBlueprint {
  moduleDir: string;
  dataFile: string;
  actionFile: string;
  pageDir: string;
  serverPage: string;
  clientComponentsDir: string;
  clientShellFile: string;
  detailPage?: string;
}

export interface ModulePageShellBlueprint {
  serverResponsibilities: string[];
  clientResponsibilities: string[];
  forbiddenInServerPage: string[];
  forbiddenInClientShell: string[];
}

export interface ModuleCacheBlueprint {
  tags: {
    root: string;
    list: string;
    itemPattern: string;
    slices: string[];
  };
  queryKeys: {
    root: readonly ['module', string];
    exampleListKey: readonly ['module', string, 'list', Record<string, unknown>];
    exampleItemKey: readonly ['module', string, 'item', string];
  };
  rules: string[];
}

export interface ModuleLegacyTarget {
  path: string;
  status: 'legacy' | 'remove-after-migration';
  replacement: string;
}

export interface ModuleBlueprint {
  id: string;
  routeSegment: string;
  summary: string;
  directories: ModuleDirectoryBlueprint;
  dataLayer: {
    authoritativeFile: string;
    responsibilities: string[];
    rules: string[];
  };
  actions: {
    authoritativeFile: string;
    targetActions: string[];
    rules: string[];
  };
  pageShell: ModulePageShellBlueprint;
  cache: ModuleCacheBlueprint;
  keep: string[];
  legacy: ModuleLegacyTarget[];
  migrationSteps: string[];
}

export function createModuleCacheTags(moduleId: string): ModuleCacheTags {
  return {
    root: `module:${moduleId}`,
    list: `module:${moduleId}:list`,
    item: (id: string) => `module:${moduleId}:item:${id}`,
    slice: (dimension: string, value: string) => `module:${moduleId}:${dimension}:${value}`,
  };
}

export function createModuleQueryKeys(moduleId: string): ModuleQueryKeys {
  return {
    root: ['module', moduleId],
    list: (params: Record<string, unknown> = {}) => ['module', moduleId, 'list', params],
    item: (id: string) => ['module', moduleId, 'item', id],
  };
}

export function defineModuleBlueprint<T extends ModuleBlueprint>(blueprint: T): T {
  return blueprint;
}

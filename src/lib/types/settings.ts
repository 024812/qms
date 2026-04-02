export interface AppSettings {
  appName: string;
  language: 'zh' | 'en';
  itemsPerPage: number;
  defaultView: 'list' | 'grid';
  doubleClickAction: 'none' | 'view' | 'status' | 'edit';
  usageDoubleClickAction: 'none' | 'view' | 'edit';
}

export interface UpdateAppSettingsInput {
  appName?: string;
  language?: 'zh' | 'en';
  itemsPerPage?: number;
  defaultView?: 'list' | 'grid';
  doubleClickAction?: 'none' | 'view' | 'status' | 'edit';
  usageDoubleClickAction?: 'none' | 'view' | 'edit';
}

export interface DatabaseStats {
  totalQuilts: number;
  totalUsageRecords: number;
  activeUsage: number;
  provider: string;
  connected: boolean;
}

export interface SystemInfo {
  version: string;
  framework: string;
  deployment: string;
  database: string;
  nodeVersion: string;
  environment: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ExportData {
  exportDate: string;
  quilts: unknown[];
  usageRecords: unknown[];
}

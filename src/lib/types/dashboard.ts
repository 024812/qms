export interface DashboardOverview {
  totalQuilts: number;
  inUseCount: number;
  storageCount: number;
  maintenanceCount: number;
}

export interface DashboardDistribution {
  seasonal: {
    WINTER: number;
    SPRING_AUTUMN: number;
    SUMMER: number;
  };
  location: Record<string, number>;
  brand: Record<string, number>;
}

export interface DashboardTopUsedQuilt {
  id: string;
  name: string;
  usageCount: number;
}

export interface DashboardRecentActivity {
  id: string;
  type: string;
  quiltName: string;
  date: string;
}

export interface DashboardInUseQuilt {
  id: string;
  name: string;
  itemNumber: number;
  season: string;
  fillMaterial: string;
  weightGrams: number;
  location: string;
}

export interface DashboardHistoricalUsage {
  id: string;
  quiltId: string;
  quiltName: string;
  itemNumber: number;
  season: string;
  startDate: string;
  endDate: string | null;
  year: number;
}

export interface DashboardStatsView {
  overview: DashboardOverview;
  distribution: DashboardDistribution;
  topUsedQuilts: DashboardTopUsedQuilt[];
  recentActivity: DashboardRecentActivity[];
  inUseQuilts: DashboardInUseQuilt[];
  historicalUsage: DashboardHistoricalUsage[];
  date: {
    today: string;
    monthDay: string;
  };
  lastUpdated: string;
}

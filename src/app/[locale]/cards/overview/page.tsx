import {
  getCardStatsAction,
  getMonthlyBuySellDataAction,
  getRecentActivityAction,
} from '@/app/actions/cards';
import { auth } from '@/auth';
import { CreditCard, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { MonthlyChart } from '@/components/cards/MonthlyChart';
import { RecentActivityList } from '@/components/cards/RecentActivityList';

type Props = {
  params: Promise<{ locale: string }>;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export default async function CardOverviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('cards.overview');

  const session = await auth();
  if (!session?.user?.id) return redirect('/api/auth/signin');

  const [statsResult, monthlyDataResult, recentActivitiesResult] = await Promise.all([
    getCardStatsAction(),
    getMonthlyBuySellDataAction(),
    getRecentActivityAction(10),
  ]);

  if (!statsResult.success) {
    throw new Error(statsResult.error.message);
  }

  if (!monthlyDataResult.success) {
    throw new Error(monthlyDataResult.error.message);
  }

  if (!recentActivitiesResult.success) {
    throw new Error(recentActivitiesResult.error.message);
  }

  const stats = statsResult.data;
  const monthlyData = monthlyDataResult.data;
  const recentActivities = recentActivitiesResult.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Collection Cost */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('collectionCost')}</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatCurrency(stats.collectionCost)}</div>
            <p className="text-xs text-muted-foreground">{t('collectionCostDesc')}</p>
          </div>
        </div>

        {/* Total Historical Spend */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('totalSpend')}</h3>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</div>
            <p className="text-xs text-muted-foreground">{t('totalSpendDesc')}</p>
          </div>
        </div>

        {/* Total Sold Amount */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('totalSales')}</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSold)}</div>
            <p className="text-xs text-muted-foreground">{t('totalSalesDesc')}</p>
          </div>
        </div>

        {/* Realized P&L */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">{t('realizedPnL')}</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div
              className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(stats.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">{t('realizedPnLDesc')}</p>
          </div>
        </div>
      </div>

      {/* Monthly Chart & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">{t('monthlyBuySell')}</h3>
          <MonthlyChart data={monthlyData} />
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">{t('recentActivity')}</h3>
          <RecentActivityList activities={recentActivities} />
        </div>
      </div>
    </div>
  );
}

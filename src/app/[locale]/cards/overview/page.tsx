import { getCardStats } from '@/app/actions/card-stats';
import { auth } from '@/auth';
import { CreditCard, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

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

  const stats = await getCardStats(session.user.id);

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

      {/* Suggestions for Future Content */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">{t('portfolioDistribution')}</h3>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
            {t('chartPlaceholder')}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-semibold mb-4">{t('recentActivity')}</h3>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
            {t('listPlaceholder')}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { MonthlyBuySellData } from '@/app/actions/card-overview-data';

interface MonthlyChartProps {
  data: MonthlyBuySellData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const t = useTranslations('cards.overview');

  // Format month label to short form: "2025-03" -> "Mar"
  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(Number(year), Number(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  const chartData = data.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  const hasData = data.some(d => d.bought > 0 || d.sold > 0);

  if (!hasData) {
    return (
      <div className="h-[240px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
        {t('noChartData')}
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={value => `$${value}`}
          />
          <Tooltip
            formatter={
              ((value: number, name: string) => [
                `$${value.toFixed(2)}`,
                name === 'bought' ? t('bought') : t('sold'),
              ]) as any
            }
            labelFormatter={label => label}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
          <Legend formatter={(value: string) => (value === 'bought' ? t('bought') : t('sold'))} />
          <Bar dataKey="bought" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="sold" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

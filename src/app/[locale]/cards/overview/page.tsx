import { getTranslations } from 'next-intl/server';

export default async function CardOverviewPage() {
  const t = await getTranslations('cards.sidebar');
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t('cardOverview')}</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
}

import { useTranslations } from 'next-intl';

export default function SoldCardsPage() {
  const t = useTranslations('cards.sidebar');
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{t('soldCards')}</h1>
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
}

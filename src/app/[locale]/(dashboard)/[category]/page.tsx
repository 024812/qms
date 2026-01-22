import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import { getModule, getModuleIds } from '@/modules/registry';
import { ItemList } from '@/modules/core/ui/ItemList';
import { Suspense, use } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getItems } from '@/app/actions/items';
import { routing } from '@/i18n/routing';

// Generate static params for all known categories and locales
export function generateStaticParams() {
  const locales = routing.locales;
  const categories = getModuleIds();

  const params: { locale: string; category: string }[] = [];

  for (const locale of locales) {
    for (const category of categories) {
      params.push({ locale, category });
    }
  }

  return params;
}

interface PageProps {
  params: Promise<{
    locale: string;
    category: string;
  }>;
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

export default function ModulePage({ params, searchParams }: PageProps) {
  const { locale, category } = use(params);
  
  // Enable static rendering
  setRequestLocale(locale);
  const t = useTranslations();

  const module = getModule(category);

  if (!module) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
             {t(`users.modules.${module.id}`) || module.name}
          </h1>
          <p className="text-muted-foreground mt-1">
             {module.description}
          </p>
        </div>
        <Button asChild>
          <Link href={`/${category}/new`}>
            <Plus className="w-4 h-4 mr-2" />
            {t('common.create')}
          </Link>
        </Button>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ItemListContainer 
            category={category} 
            searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

async function ItemListContainer({ 
    category, 
    searchParams 
}: { 
    category: string, 
    searchParams: Promise<{ page?: string; status?: string; search?: string }> 
}) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const status = params.status;
    const search = params.search;

    const result = await getItems(category, {
        page,
        status,
        search
    });

    return (
        <ItemList 
            items={result.data} 
            moduleType={category}
        />
    );
}

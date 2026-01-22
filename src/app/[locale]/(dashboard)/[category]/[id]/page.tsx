import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/modules/core/ui/StatusBadge';

import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import { getModule } from '@/modules/registry';
import { use } from 'react';
import { getItemById } from '@/app/actions/items';

// We rely on dynamic rendering for items as the list is indefinite.
// cacheComponents might require this page to be dynamic explicitly if generateStaticParams is missing?
// Or we just don't export it.

interface PageProps {
  params: Promise<{
    locale: string;
    category: string;
    id: string;
  }>;
}

export default function ItemDetail({ params }: PageProps) {
  const { locale, category, id } = use(params);
  
  // Enable static rendering
  setRequestLocale(locale);
  const t = useTranslations();

  const module = getModule(category);

  if (!module) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link
          href={`/${category}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          {t('common.back')}
        </Link>
      </div>

      <ItemDetailContent category={category} id={id} />
    </div>
  );
}

async function ItemDetailContent({ category, id }: { category: string; id: string }) {
  const t = useTranslations();
  
  try {
    const item = await getItemById(category, id);

    if (!item) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">{t('common.error')}</h2>
                <p className="text-muted-foreground">Item not found</p>
            </div>
        )
    }

    // Handle different item types for name display
    let itemName = '';
    let itemStatus: string | undefined | null = '';
    let itemDescription: string | undefined | null = '';

    if ('playerName' in item) {
        // It's a Card
        itemName = `${item.year} ${item.brand} ${item.playerName}`;
        itemStatus = item.status;
        itemDescription = item.notes; // Cards use notes, not description
    } else {
        // It's a Quilt (or has name)
        itemName = (item as any).name || 'Unknown Item';
        itemStatus = (item as any).currentStatus || (item as any).status;
        itemDescription = (item as any).notes || (item as any).description;
    }

    return (
        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">{itemName}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>ID: {item.id}</span>
              <span>•</span>
              {itemStatus && <StatusBadge status={itemStatus} />}
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${category}/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              {t('common.edit')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm">{itemDescription || item.notes || 'No description provided.'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(item).map(([key, value]) => {
                  if (['id', 'name', 'description', 'notes', 'status', 'currentStatus', 'images', 'userId', 'updatedAt', 'mainImage', 'attachmentImages'].includes(key)) return null;
                  if (typeof value === 'object' && value !== null && !(value instanceof Date)) return null; 
                  
                  return (
                    <div key={key}>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        {key}
                      </h4>
                      <p className="text-sm font-medium">
                        {value instanceof Date ? value.toLocaleDateString() : String(value)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );

  } catch (err) {
      console.error(err);
      return (
        <div className="text-center py-12">
            <h2 className="text-xl font-semibold">{t('common.error')}</h2>
        </div>
      )
  }
}

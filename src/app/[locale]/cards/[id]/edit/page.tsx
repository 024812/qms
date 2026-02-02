import { notFound } from 'next/navigation';
import { getCard } from '@/app/actions/card-actions';
import { CardForm } from '../../components/CardForm';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface EditCardPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function EditCardPage({ params }: EditCardPageProps) {
  const { id } = await params;
  const card = await getCard(id);
  const t = await getTranslations('cards.form');

  if (!card) {
    notFound();
  }

  console.log('EditCardPage: fetched card', {
    id: card.id,
    attachmentImages: card.attachmentImages,
    mainImage: card.mainImage,
  });

  // Robustly parse attachmentImages
  let backImage = null;
  const attachments = card.attachmentImages;

  if (Array.isArray(attachments) && attachments.length > 0) {
    backImage = attachments[0];
  } else if (typeof attachments === 'string') {
    // Attempt to parse stringified JSON or treat as single URL
    try {
      const parsed = JSON.parse(attachments as string);
      if (Array.isArray(parsed) && parsed.length > 0) {
        backImage = parsed[0];
      }
    } catch {
      // If parse fails, might be a single raw URL string
      if ((attachments as string).length > 20) {
        // arbitrary primitive check
        backImage = attachments;
      }
    }
  }

  // Convert DB card to Form initial values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialData: any = {
    ...card,
    // Ensure relations or specific fields are mapped correctly if needed
    // For now spread is mostly compatible with FormValues
    backImage: backImage,
  };

  return (
    <div className="container py-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/cards/${id}`}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('cancel')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('editTitle') || 'Edit Card'}</h1>
      </div>

      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <CardForm initialData={initialData} />
      </div>
    </div>
  );
}

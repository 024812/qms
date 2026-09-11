'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleItemDialog } from '@/modules/core/ui/ModuleItemDialog';
import { mapsModule } from '@/modules/maps/config';
import { deleteMapAction, updateMapAction } from '@/app/actions/maps';
import type { UpdateMapInput } from '@/modules/maps/schema';
import type { MapDTO } from '@/lib/data/maps';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';
import { toast } from '@/lib/toast';

interface MapDetailActionsProps {
  item: MapDTO;
}

export function MapDetailActions({ item }: MapDetailActionsProps) {
  const t = useTranslations('maps');
  const tc = useTranslations('common');
  const ta = useTranslations('actions');
  const router = useRouter();
  const formFields = useLocalizedFields('maps', mapsModule.formFields);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (values: Record<string, unknown>) => {
    const result = await updateMapAction({ id: item.id, ...values } as UpdateMapInput);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    router.refresh();
    return { success: true };
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('dialogs.deleteConfirm'))) return;

    setDeleting(true);
    try {
      const result = await deleteMapAction(item.id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      toast.success(ta('deletedSuccessfully'));
      router.push('/maps');
    } catch (error) {
      toast.error(ta('failedToDelete'), error instanceof Error ? error.message : undefined);
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Button onClick={() => setEditOpen(true)} disabled={deleting}>
        <Pencil className="mr-2 h-4 w-4" />
        {tc('edit')}
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
        {deleting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="mr-2 h-4 w-4" />
        )}
        {tc('delete')}
      </Button>

      <ModuleItemDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={t('dialogs.editTitle')}
        description={t('dialogs.editDesc')}
        fields={formFields}
        item={item}
        onSubmit={handleUpdate}
        successMessage={ta('updatedSuccessfully')}
        errorMessage={ta('failedToUpdate')}
        submitLabel={tc('save')}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleItemDialog } from '@/modules/core/ui/ModuleItemDialog';
import { paddleModule } from '@/modules/paddles/config';
import { deletePaddleAction, updatePaddleAction } from '@/app/actions/paddles';
import type { PaddleItem, UpdatePaddleInput } from '@/modules/paddles/schema';
import { useLocalizedFields } from '@/hooks/useLocalizedFields';
import { toast } from '@/lib/toast';

interface PaddleDetailActionsProps {
  item: PaddleItem;
}

export function PaddleDetailActions({ item }: PaddleDetailActionsProps) {
  const t = useTranslations('paddles');
  const tc = useTranslations('common');
  const ta = useTranslations('actions');
  const router = useRouter();
  const formFields = useLocalizedFields('paddles', paddleModule.formFields);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdate = async (values: Record<string, unknown>) => {
    const result = await updatePaddleAction({ id: item.id, ...values } as UpdatePaddleInput);
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
      const result = await deletePaddleAction(item.id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      toast.success(ta('deletedSuccessfully'));
      router.push('/paddles');
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

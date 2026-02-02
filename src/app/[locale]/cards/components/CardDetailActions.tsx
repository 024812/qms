'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Link } from '@/i18n/routing';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteCard } from '@/app/actions/card-actions';
import { useToast } from '@/hooks/useToast';
import type { CardItem } from '@/modules/cards/schema';

interface CardDetailActionsProps {
  card: CardItem;
}

export function CardDetailActions({ card }: CardDetailActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const handleDelete = async () => {
    try {
      await deleteCard(card.id);
      success('Success', 'Card deleted successfully');
      router.push('/cards');
    } catch (err) {
      console.error(err);
      error('Error', 'Failed to delete card');
    }
  };

  return (
    <div className="flex gap-2">
      {/* Edit - Navigate to dedicated edit page */}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/cards/${card.id}/edit`}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit
        </Link>
      </Button>

      {/* Delete - Keep as AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the card &quot;{card.year}{' '}
              {card.brand} {card.playerName}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

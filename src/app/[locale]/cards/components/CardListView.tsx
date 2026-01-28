'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CardItem } from '@/modules/cards/schema';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Copy, Trash, Eye } from 'lucide-react';
import { deleteCard, saveCard } from '@/app/actions/card-actions';
import { toast } from 'sonner';

interface CardListViewProps {
  items: CardItem[];
}

export function CardListView({ items }: CardListViewProps) {
  const router = useRouter();
  const t = useTranslations('cards');

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    // eslint-disable-next-line no-alert
    if (confirm(t('dialogs.deleteDescription'))) {
      try {
        await deleteCard(id);
        toast.success(t('dialogs.deleteSuccess'));
      } catch {
        toast.error(t('form.error'));
      }
    }
  };

  const handleClone = async (item: CardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, updatedAt, ...cloneData } = item;
      await saveCard({
        ...cloneData,
        playerName: `${item.playerName} (Copy)`,
        itemNumber: undefined, // Let DB generate new
      });
      toast.success(t('form.success'));
    } catch {
      toast.error(t('form.error'));
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app this might open a modal or navigate to edit page
    // For now we navigate to detail which usually has edit
    router.push(`/cards/${id}`);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">{t('list.image')}</TableHead>
            <TableHead className="w-[80px]">{t('list.itemNumber')}</TableHead>
            <TableHead>{t('list.player')}</TableHead>
            <TableHead>{t('list.year')}</TableHead>
            <TableHead>{t('list.brand')}</TableHead>
            <TableHead>{t('list.sport')}</TableHead>
            <TableHead>{t('list.grade')}</TableHead>
            <TableHead>{t('list.value')}</TableHead>
            <TableHead>{t('list.status')}</TableHead>
            <TableHead className="w-[50px]">{t('list.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                {t('messages.noQuiltsFound')}
              </TableCell>
            </TableRow>
          ) : (
            items.map(card => (
              <TableRow
                key={card.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/cards/${card.id}`)}
              >
                {/* Image Thumbnail */}
                <TableCell className="py-2">
                  <div className="relative w-10 h-14 bg-muted rounded overflow-hidden border">
                    {card.mainImage ? (
                      <Image
                        src={card.mainImage}
                        alt={card.playerName}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs">#{card.itemNumber}</TableCell>
                <TableCell className="font-medium">{card.playerName}</TableCell>
                <TableCell>{card.year}</TableCell>
                <TableCell className="text-muted-foreground">{card.brand}</TableCell>

                <TableCell>
                  <Badge variant="outline" className={getSportColor(card.sport)}>
                    {t(`enums.sports.${card.sport}`) || card.sport}
                  </Badge>
                </TableCell>

                <TableCell>
                  {card.gradingCompany !== 'UNGRADED' ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-800 border-amber-200"
                    >
                      {card.gradingCompany} {card.grade}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </TableCell>

                <TableCell>
                  {card.currentValue ? `$${card.currentValue.toLocaleString()}` : '-'}
                </TableCell>

                <TableCell>
                  <Badge className={getStatusColor(card.status)}>
                    {t(`enums.status.${card.status}`) || card.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>{t('list.actions')}</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => router.push(`/cards/${card.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        {t('actions.viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={e => handleEdit(card.id, e)}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('actions.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={e => handleClone(card, e)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t('actions.clone')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={e => handleDelete(card.id, e)}
                        className="text-red-600 focus:text-red-500"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        {t('actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Helpers
function getSportColor(sport: string) {
  switch (sport) {
    case 'BASKETBALL':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'SOCCER':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'COLLECTION':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'FOR_SALE':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
    case 'SOLD':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    case 'GRADING':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

'use client';

/**
 * Sold Card List View Component
 *
 * Displays sold cards in a table format with profit analysis.
 */

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HighlightText } from '@/components/ui/highlight-text';
import type { CardItem } from '@/modules/cards/schema';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit, Trash, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { deleteCard } from '@/app/actions/card-actions';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/modules/cards/utils';

interface SoldCardListViewProps {
  items: CardItem[];
  onCardsChange?: () => void;
  searchTerm?: string;
}

type SortKey = keyof CardItem | 'profit';

export function SoldCardListView({ items, onCardsChange, searchTerm = '' }: SoldCardListViewProps) {
  const router = useRouter();
  const t = useTranslations('cards');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(
    null
  );

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCardToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCard(cardToDelete);
      toast.success(t('dialogs.deleteSuccess'));
      onCardsChange?.();
      router.refresh();
    } catch {
      toast.error(t('form.error'));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/cards/${id}`);
  };

  const calculateProfit = (
    soldPrice: string | number | null,
    purchasePrice: string | number | null
  ) => {
    const sold = Number(soldPrice) || 0;
    const purchase = Number(purchasePrice) || 0;

    // If we don't have a valid purchase price, profit is just the sold amount (assuming 0 cost),
    // but better to handle it carefully or assume 0 is real cost.
    // If purchasePrice is missing (null/undefined), it's harder to calculate true profit.
    // We'll treat missing as 0 for simple calc, but UI might want to indicate.

    const profit = sold - purchase;
    const roi = purchase > 0 ? (profit / purchase) * 100 : 0;

    return { profit, roi };
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    let aValue: any;
    let bValue: any;

    if (key === 'profit') {
      aValue = calculateProfit(a.soldPrice, a.purchasePrice).profit;
      bValue = calculateProfit(b.soldPrice, b.purchasePrice).profit;
    } else {
      aValue = a[key as keyof CardItem];
      bValue = b[key as keyof CardItem];

      // Convert string representations to numbers for proper numeric sorting
      if (
        [
          'purchasePrice',
          'currentValue',
          'estimatedValue',
          'soldPrice',
          'itemNumber',
          'year',
          'grade',
        ].includes(key as string)
      ) {
        if (aValue !== null && aValue !== undefined) aValue = Number(aValue);
        if (bValue !== null && bValue !== undefined) bValue = Number(bValue);
      }
    }

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">{t('list.image')}</TableHead>
              <TableHead
                className="w-[80px] cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('itemNumber')}
              >
                <div className="flex items-center">
                  {t('list.itemNumber')}
                  {renderSortIcon('itemNumber')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('playerName')}
              >
                <div className="flex items-center">
                  {t('list.player')}
                  {renderSortIcon('playerName')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('year')}
              >
                <div className="flex items-center">
                  {t('list.year')}
                  {renderSortIcon('year')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('brand')}
              >
                <div className="flex items-center">
                  {t('list.brand')}
                  {renderSortIcon('brand')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('grade')}
              >
                <div className="flex items-center">
                  {t('list.grade')}
                  {renderSortIcon('grade')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('purchasePrice')}
              >
                <div className="flex items-center">
                  {t('list.purchasePrice')}
                  {renderSortIcon('purchasePrice')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('purchaseDate')}
              >
                <div className="flex items-center">
                  {t('list.purchaseDate')}
                  {renderSortIcon('purchaseDate')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('soldPrice')}
              >
                <div className="flex items-center">
                  {t('list.soldPrice')}
                  {renderSortIcon('soldPrice')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('soldDate')}
              >
                <div className="flex items-center">
                  {t('list.soldDate')}
                  {renderSortIcon('soldDate')}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('profit')}
              >
                <div className="flex items-center">
                  {t('list.profit')}
                  {renderSortIcon('profit')}
                </div>
              </TableHead>
              <TableHead className="w-[50px]">{t('list.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  {t('messages.noCardsFound')}
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map(card => {
                const { profit, roi } = calculateProfit(card.soldPrice, card.purchasePrice);
                const isProfitable = profit >= 0;

                return (
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
                    <TableCell className="font-medium">
                      <HighlightText text={card.playerName} searchTerm={searchTerm} />
                    </TableCell>
                    <TableCell>{card.year}</TableCell>
                    <TableCell className="text-muted-foreground">{card.brand}</TableCell>

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

                    <TableCell>{formatCurrency(card.purchasePrice)}</TableCell>
                    <TableCell>{formatDate(card.purchaseDate)}</TableCell>

                    <TableCell>{formatCurrency(card.soldPrice)}</TableCell>
                    <TableCell>{formatDate(card.soldDate)}</TableCell>

                    {/* Profit Column */}
                    <TableCell>
                      <div
                        className={`flex flex-col text-sm ${isProfitable ? 'text-green-600' : 'text-red-600'}`}
                      >
                        <span className="font-bold">
                          {isProfitable ? '+' : ''}
                          {formatCurrency(profit)}
                        </span>
                        <span className="text-xs opacity-80">
                          {isProfitable ? '+' : ''}
                          {roi.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={e => handleEdit(card.id, e)}
                          title={t('actions.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={e => handleDeleteClick(card.id, e)}
                          title={t('actions.delete')}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialogs.deleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('dialogs.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dialogs.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

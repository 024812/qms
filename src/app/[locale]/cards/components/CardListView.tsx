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

interface CardListViewProps {
  items: CardItem[];
}

export function CardListView({ items }: CardListViewProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Item #</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Year / Brand</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No cards found.
              </TableCell>
            </TableRow>
          ) : (
            items.map(card => (
              <TableRow
                key={card.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/cards/${card.id}`)} // Will implement detail page later
              >
                <TableCell className="font-mono text-xs">#{card.itemNumber}</TableCell>
                <TableCell className="font-medium">{card.playerName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getSportColor(card.sport)}>
                    {card.sport}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{card.year}</span>
                    <span className="text-xs text-muted-foreground">{card.brand}</span>
                  </div>
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
                  <Badge className={getStatusColor(card.status)}>{card.status}</Badge>
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

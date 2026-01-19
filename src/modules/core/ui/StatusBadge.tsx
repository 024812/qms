/**
 * StatusBadge Component
 * 
 * Displays item status with appropriate styling and labels.
 * Supports all item status types defined in the database schema.
 * 
 * Requirements: 4.1
 */

import { Badge } from '@/components/ui/badge';

/**
 * Item status type
 */
type ItemStatus = 'in_use' | 'storage' | 'maintenance' | 'lost';

/**
 * StatusBadge Props
 */
interface StatusBadgeProps {
  status: ItemStatus | string;
  className?: string;
}

/**
 * Status configuration
 * Maps status values to display labels and badge variants
 */
const STATUS_CONFIG: Record<
  ItemStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
  }
> = {
  in_use: {
    label: '使用中',
    variant: 'default',
  },
  storage: {
    label: '存储中',
    variant: 'secondary',
  },
  maintenance: {
    label: '维护中',
    variant: 'outline',
  },
  lost: {
    label: '丢失',
    variant: 'destructive',
  },
};

/**
 * StatusBadge Component
 * 
 * Renders a badge with appropriate styling based on item status.
 * Falls back to secondary variant for unknown status values.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as ItemStatus] || {
    label: status,
    variant: 'secondary' as const,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

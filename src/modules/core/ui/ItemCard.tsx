/**
 * ItemCard Component
 * 
 * Generic item card component that dynamically renders module-specific card components.
 * Uses the Strategy Pattern to delegate rendering to module-specific CardComponent.
 * 
 * Requirements: 4.1, 4.2
 */

import { getModule } from '@/modules/registry';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

/**
 * ItemCard Props
 */
interface ItemCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  onClick?: () => void;
}

/**
 * ItemCard Component
 * 
 * Renders a card for any item type by delegating to the module-specific CardComponent.
 * Falls back to a default card layout if no custom CardComponent is provided.
 */
export function ItemCard({ item, onClick }: ItemCardProps) {
  const t = useTranslations('status');
  const moduleConfig = getModule(item.type);

  if (!moduleConfig) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
        <CardContent className="p-4">
          <div className="text-destructive">Unknown module type: {item.type}</div>
        </CardContent>
      </Card>
    );
  }

  // Use module-specific CardComponent if provided
  if (moduleConfig.CardComponent) {
    const { CardComponent } = moduleConfig;
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
        <CardContent className="p-4">
          <CardComponent item={item} />
        </CardContent>
      </Card>
    );
  }

  // Default card layout if no custom component
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <Badge variant={getStatusVariant(item.status)}>{t(item.status.toUpperCase())}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{moduleConfig.name}</p>
          <div className="text-xs text-muted-foreground">
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get badge variant based on status
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'in_use':
      return 'default';
    case 'storage':
      return 'secondary';
    case 'maintenance':
      return 'outline';
    case 'lost':
      return 'destructive';
    default:
      return 'secondary';
  }
}

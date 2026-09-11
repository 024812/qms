/**
 * PaddleCard Component
 *
 * Display component for paddle items in list view
 */

import { useTranslations } from 'next-intl';
import type { PaddleItem } from '../schema';

export interface PaddleCardProps {
  item: PaddleItem;
  onClick?: () => void;
}

export function PaddleCard({ item, onClick }: PaddleCardProps) {
  const t = useTranslations('paddles');

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <span className="text-sm text-gray-500">#{item.itemNumber}</span>
      </div>

      {item.bladeBrand && (
        <div className="text-sm text-gray-600 mb-1">
          {item.bladeBrand}
          {item.bladeModel && ` - ${item.bladeModel}`}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
        {item.bladeWeightG && (
          <div>
            <span className="text-gray-500">{t('fields.bladeWeightG.label')}:</span>{' '}
            {item.bladeWeightG}g
          </div>
        )}
        {item.handleType && (
          <div>
            <span className="text-gray-500">{t('fields.handleType.label')}:</span>{' '}
            {t(`enums.handleType.${item.handleType}`)}
          </div>
        )}
        {item.bladeSpeed && (
          <div>
            <span className="text-gray-500">{t('fields.bladeSpeed.label')}:</span> {item.bladeSpeed}
            /10
          </div>
        )}
        {item.bladeControl && (
          <div>
            <span className="text-gray-500">{t('fields.bladeControl.label')}:</span>{' '}
            {item.bladeControl}/10
          </div>
        )}
      </div>

      {(item.forehandRubber || item.backhandRubber) && (
        <div className="mt-3 text-sm">
          {item.forehandRubber && (
            <div>
              <span className="text-gray-500">{t('fields.forehandRubber.label')}:</span>{' '}
              {item.forehandRubber}
            </div>
          )}
          {item.backhandRubber && (
            <div>
              <span className="text-gray-500">{t('fields.backhandRubber.label')}:</span>{' '}
              {item.backhandRubber}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-3 border-t">
        <span
          className={`text-xs px-2 py-1 rounded ${
            item.status === 'ACTIVE'
              ? 'bg-green-100 text-green-800'
              : item.status === 'RETIRED'
                ? 'bg-gray-100 text-gray-800'
                : item.status === 'FOR_SALE'
                  ? 'bg-blue-100 text-blue-800'
                  : item.status === 'SOLD'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-purple-100 text-purple-800'
          }`}
        >
          {t(`enums.status.${item.status}`)}
        </span>
        {item.location && <span className="text-xs text-gray-500">{item.location}</span>}
      </div>
    </div>
  );
}

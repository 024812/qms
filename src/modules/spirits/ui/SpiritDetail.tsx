/**
 * Spirit Detail Component
 *
 * Displays detailed information about a spirit item.
 */

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { SpiritItem } from '../schema';

interface SpiritDetailProps {
  item: SpiritItem;
}

export function SpiritDetail({ item }: SpiritDetailProps) {
  const t = useTranslations('spirits');
  const tc = useTranslations('common');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <span className="text-lg text-gray-500">#{item.itemNumber}</span>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {t(`enums.spiritType.${item.spiritType}`)}
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            {t(`enums.status.${item.status}`)}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {t(`enums.bottleStatus.${item.bottleStatus}`)}
          </span>
          {item.limitedEdition && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
              {t('fields.limitedEdition.label')}
            </span>
          )}
        </div>
      </div>

      {/* Main Image */}
      {item.mainImage && (
        <div className="w-full max-w-2xl mx-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.mainImage} alt={item.name} className="w-full rounded-lg shadow-lg" />
        </div>
      )}

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        {item.brand && (
          <div>
            <div className="text-sm text-gray-500">{t('fields.brand.label')}</div>
            <div className="font-medium">{item.brand}</div>
          </div>
        )}
        {item.distillery && (
          <div>
            <div className="text-sm text-gray-500">{t('fields.distillery.label')}</div>
            <div className="font-medium">{item.distillery}</div>
          </div>
        )}
        {item.region && (
          <div>
            <div className="text-sm text-gray-500">{t('fields.region.label')}</div>
            <div className="font-medium">{item.region}</div>
          </div>
        )}
        {item.country && (
          <div>
            <div className="text-sm text-gray-500">{t('fields.country.label')}</div>
            <div className="font-medium">{item.country}</div>
          </div>
        )}
      </div>

      {/* Vintage & Age */}
      {(item.vintage || item.age || item.abv) && (
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          {item.vintage && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.vintage.label')}</div>
              <div className="font-medium">{item.vintage}</div>
            </div>
          )}
          {item.age && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.age.label')}</div>
              <div className="font-medium">
                {item.age} {tc('years')}
              </div>
            </div>
          )}
          {item.abv && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.abv.label')}</div>
              <div className="font-medium">{item.abv}%</div>
            </div>
          )}
        </div>
      )}

      {/* Bottle Details */}
      {(item.volumeMl || item.bottleNumber || item.caskType) && (
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          {item.volumeMl && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.volumeMl.label')}</div>
              <div className="font-medium">{item.volumeMl} ml</div>
            </div>
          )}
          {item.bottleNumber && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.bottleNumber.label')}</div>
              <div className="font-medium">{item.bottleNumber}</div>
            </div>
          )}
          {item.caskType && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.caskType.label')}</div>
              <div className="font-medium">{item.caskType}</div>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      {(item.bottlingDate || item.acquiredDate) && (
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          {item.bottlingDate && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.bottlingDate.label')}</div>
              <div className="font-medium">
                {new Date(item.bottlingDate).toLocaleDateString(dateLocale)}
              </div>
            </div>
          )}
          {item.acquiredDate && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.acquiredDate.label')}</div>
              <div className="font-medium">
                {new Date(item.acquiredDate).toLocaleDateString(dateLocale)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Value Information */}
      {(item.purchasePrice || item.currentValue || item.estimatedValue) && (
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          {item.purchasePrice && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.purchasePrice.label')}</div>
              <div className="font-medium">¥{Number(item.purchasePrice).toLocaleString()}</div>
            </div>
          )}
          {item.currentValue && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.currentValue.label')}</div>
              <div className="font-medium">¥{Number(item.currentValue).toLocaleString()}</div>
            </div>
          )}
          {item.estimatedValue && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.estimatedValue.label')}</div>
              <div className="font-medium">¥{Number(item.estimatedValue).toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Storage */}
      {(item.location || item.storageCondition) && (
        <div className="border-t pt-4">
          {item.location && (
            <div className="mb-3">
              <div className="text-sm text-gray-500">{t('fields.location.label')}</div>
              <div className="font-medium">{item.location}</div>
            </div>
          )}
          {item.storageCondition && (
            <div>
              <div className="text-sm text-gray-500">{t('fields.storageCondition.label')}</div>
              <div className="font-medium whitespace-pre-wrap">{item.storageCondition}</div>
            </div>
          )}
        </div>
      )}

      {/* Tasting Notes */}
      {item.tastingNotes && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500 mb-2">{t('fields.tastingNotes.label')}</div>
          <div className="prose max-w-none whitespace-pre-wrap">{item.tastingNotes}</div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500 mb-2">{t('fields.notes.label')}</div>
          <div className="whitespace-pre-wrap">{item.notes}</div>
        </div>
      )}

      {/* Attachment Images */}
      {item.attachmentImages && item.attachmentImages.length > 0 && (
        <div className="border-t pt-4">
          <div className="text-sm text-gray-500 mb-3">{t('fields.attachmentImages.label')}</div>
          <div className="grid grid-cols-3 gap-4">
            {item.attachmentImages.map((img, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${img}-${idx}`}
                src={img}
                alt={`${item.name} - ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t pt-4 text-sm text-gray-500">
        <div>
          {tc('createdAt')}: {new Date(item.createdAt).toLocaleString(dateLocale)}
        </div>
        <div>
          {tc('updatedAt')}: {new Date(item.updatedAt).toLocaleString(dateLocale)}
        </div>
      </div>
    </div>
  );
}

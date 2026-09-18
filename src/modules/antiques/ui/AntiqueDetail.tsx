/**
 * Antique Detail Component
 *
 * Display component for antique item detail view.
 */

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { AntiqueItem } from '../schema';

interface AntiqueDetailProps {
  item: AntiqueItem;
}

export function AntiqueDetail({ item }: AntiqueDetailProps) {
  const t = useTranslations('antiques');
  const tc = useTranslations('common');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  const formatValue = (value: string | null) => {
    if (!value) return tc('notRecorded');
    const num = parseFloat(value);
    return `¥${num.toLocaleString()}`;
  };

  const formatDimension = (value: string | null, unit: string) => {
    if (!value) return null;
    return `${value} ${unit}`;
  };

  const formatDate = (date: string | null) => {
    if (!date) return tc('notRecorded');
    return new Date(date).toLocaleDateString(dateLocale);
  };

  return (
    <div className="space-y-6">
      {/* Images */}
      {item.mainImage && (
        <div className="space-y-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.mainImage} alt={item.name} className="h-full w-full object-contain" />
          </div>

          {item.attachmentImages && item.attachmentImages.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {item.attachmentImages.map((img, idx) => (
                <div key={`${img}-${idx}`} className="aspect-square overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={`${item.name} - ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h2 className="mb-4 text-xl font-bold">{t('sections.basicInfo')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">{t('fields.itemNumber.label')}</span>
            <p className="font-medium">#{item.itemNumber}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('fields.category.label')}</span>
            <p className="font-medium">{t(`enums.category.${item.category}`)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('fields.material.label')}</span>
            <p className="font-medium">{item.material || tc('notRecorded')}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('fields.status.label')}</span>
            <p className="font-medium">{t(`enums.status.${item.status}`)}</p>
          </div>
          {item.era && (
            <div>
              <span className="text-sm text-muted-foreground">{t('fields.era.label')}</span>
              <p className="font-medium">{item.era}</p>
            </div>
          )}
          {item.dynasty && (
            <div>
              <span className="text-sm text-muted-foreground">{t('fields.dynasty.label')}</span>
              <p className="font-medium">{item.dynasty}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dimensions */}
      {(item.lengthCm || item.widthCm || item.heightCm || item.weightG) && (
        <div>
          <h2 className="mb-4 text-xl font-bold">{t('sections.dimensions')}</h2>
          <div className="grid grid-cols-2 gap-4">
            {item.lengthCm && (
              <div>
                <span className="text-sm text-muted-foreground">{t('fields.lengthCm.label')}</span>
                <p className="font-medium">{formatDimension(item.lengthCm, 'cm')}</p>
              </div>
            )}
            {item.widthCm && (
              <div>
                <span className="text-sm text-muted-foreground">{t('fields.widthCm.label')}</span>
                <p className="font-medium">{formatDimension(item.widthCm, 'cm')}</p>
              </div>
            )}
            {item.heightCm && (
              <div>
                <span className="text-sm text-muted-foreground">{t('fields.heightCm.label')}</span>
                <p className="font-medium">{formatDimension(item.heightCm, 'cm')}</p>
              </div>
            )}
            {item.weightG && (
              <div>
                <span className="text-sm text-muted-foreground">{t('fields.weightG.label')}</span>
                <p className="font-medium">{formatDimension(item.weightG, 'g')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Condition & Certification */}
      {(item.condition || item.certificate || item.appraisalBy) && (
        <div>
          <h2 className="mb-4 text-xl font-bold">{t('sections.certification')}</h2>
          <div className="space-y-3">
            {item.condition && (
              <div>
                <span className="text-sm text-muted-foreground">{t('fields.condition.label')}</span>
                <p className="mt-1">{item.condition}</p>
              </div>
            )}
            {item.certificate && (
              <div>
                <span className="text-sm text-muted-foreground">
                  {t('fields.certificate.label')}
                </span>
                <p className="mt-1">{item.certificate}</p>
              </div>
            )}
            {item.appraisalBy && (
              <div>
                <span className="text-sm text-muted-foreground">
                  {t('fields.appraisalBy.label')}
                </span>
                <p className="mt-1">{item.appraisalBy}</p>
              </div>
            )}
            {item.appraisalDate && (
              <div>
                <span className="text-sm text-muted-foreground">
                  {t('fields.appraisalDate.label')}
                </span>
                <p className="mt-1">{formatDate(item.appraisalDate)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Value Information */}
      <div>
        <h2 className="mb-4 text-xl font-bold">{t('sections.value')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-muted-foreground">{t('fields.purchasePrice.label')}</span>
            <p className="font-medium">{formatValue(item.purchasePrice)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">{t('fields.currentValue.label')}</span>
            <p className="font-medium text-green-600">{formatValue(item.currentValue)}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">
              {t('fields.estimatedValue.label')}
            </span>
            <p className="font-medium">{formatValue(item.estimatedValue)}</p>
          </div>
          {item.acquiredFrom && (
            <div>
              <span className="text-sm text-muted-foreground">
                {t('fields.acquiredFrom.label')}
              </span>
              <p className="font-medium">{item.acquiredFrom}</p>
            </div>
          )}
          {item.acquiredDate && (
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">
                {t('fields.acquiredDate.label')}
              </span>
              <p className="font-medium">{formatDate(item.acquiredDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Storage & Location */}
      {item.location && (
        <div>
          <h2 className="mb-4 text-xl font-bold">{t('sections.storage')}</h2>
          <div>
            <span className="text-sm text-muted-foreground">{t('fields.location.label')}</span>
            <p className="mt-1">{item.location}</p>
          </div>
        </div>
      )}

      {/* Notes */}
      {item.notes && (
        <div>
          <h2 className="mb-4 text-xl font-bold">{t('sections.notes')}</h2>
          <p className="whitespace-pre-wrap text-muted-foreground">{item.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <span>{tc('createdAt')}</span>
            <p>{new Date(item.createdAt).toLocaleString(dateLocale)}</p>
          </div>
          <div>
            <span>{tc('updatedAt')}</span>
            <p>{new Date(item.updatedAt).toLocaleString(dateLocale)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

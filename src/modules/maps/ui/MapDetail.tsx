/**
 * Map Detail Component
 *
 * Display component for detailed map view
 */

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { MapItem } from '../schema';
import { formatCurrency, calculateValueChange } from '../schema';

interface MapDetailProps {
  item: MapItem;
}

export function MapDetail({ item }: MapDetailProps) {
  const t = useTranslations('maps');
  const tc = useTranslations('common');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';
  const valueChange = calculateValueChange(item.currentValue, item.purchasePrice);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="text-sm text-gray-500 mb-1">#{item.itemNumber}</div>
        <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {t(`enums.mapType.${item.mapType}`)}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {t(`enums.status.${item.status}`)}
          </span>
        </div>
      </div>

      {/* Images */}
      {item.mainImage && (
        <div>
          <h2 className="text-xl font-semibold mb-3">{t('sections.images')}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.mainImage}
            alt={item.name}
            className="w-full max-w-2xl rounded-lg shadow-md"
          />
          {item.attachmentImages && item.attachmentImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {item.attachmentImages.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={img}
                  alt={`${item.name} - ${idx + 1}`}
                  className="w-full h-32 object-cover rounded shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h2 className="text-xl font-semibold mb-3">{t('sections.basicInfo')}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.mapType.label')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{t(`enums.mapType.${item.mapType}`)}</dd>
          </div>
          {item.scale && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fields.scale.label')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.scale}</dd>
            </div>
          )}
          {item.publishedYear && (
            <div>
              <dt className="text-sm font-medium text-gray-500">
                {t('fields.publishedYear.label')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{item.publishedYear}</dd>
            </div>
          )}
          {item.publisher && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fields.publisher.label')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.publisher}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.material.label')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{t(`enums.material.${item.material}`)}</dd>
          </div>
          {(item.widthCm || item.heightCm) && (
            <div>
              <dt className="text-sm font-medium text-gray-500">
                {t('fields.widthCm.label')} / {t('fields.heightCm.label')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {item.widthCm && item.heightCm
                  ? `${item.widthCm} × ${item.heightCm} cm`
                  : item.widthCm
                    ? t('labels.widthOnly', { width: item.widthCm })
                    : item.heightCm
                      ? t('labels.heightOnly', { height: item.heightCm })
                      : ''}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Geographic Information */}
      {(item.region || item.country || item.language) && (
        <div>
          <h2 className="text-xl font-semibold mb-3">{t('sections.geography')}</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.region && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('fields.region.label')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.region}</dd>
              </div>
            )}
            {item.country && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('fields.country.label')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.country}</dd>
              </div>
            )}
            {item.language && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('fields.language.label')}</dt>
                <dd className="mt-1 text-sm text-gray-900">{item.language}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Condition and Authenticity */}
      <div>
        <h2 className="text-xl font-semibold mb-3">{t('sections.condition')}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.isOriginal.label')}</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {t(`enums.isOriginal.${item.isOriginal ? 'true' : 'false'}`)}
            </dd>
          </div>
          {item.edition && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fields.edition.label')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.edition}</dd>
            </div>
          )}
          {item.condition && (
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">{t('fields.condition.label')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.condition}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Value Information */}
      {(item.purchasePrice !== null || item.currentValue !== null) && (
        <div>
          <h2 className="text-xl font-semibold mb-3">{t('sections.value')}</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.acquiredDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t('fields.acquiredDate.label')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(item.acquiredDate).toLocaleDateString(dateLocale)}
                </dd>
              </div>
            )}
            {item.purchasePrice !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t('fields.purchasePrice.label')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(item.purchasePrice)}</dd>
              </div>
            )}
            {item.currentValue !== null && (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  {t('fields.currentValue.label')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(item.currentValue)}</dd>
              </div>
            )}
            {valueChange && (
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('labels.valueChange')}</dt>
                <dd
                  className={`mt-1 text-sm font-medium ${
                    valueChange.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {valueChange.change >= 0 ? '+' : ''}
                  {formatCurrency(valueChange.change)} ({valueChange.percentage >= 0 ? '+' : ''}
                  {valueChange.percentage.toFixed(2)}%)
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Storage Information */}
      <div>
        <h2 className="text-xl font-semibold mb-3">{t('sections.storage')}</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">{t('fields.status.label')}</dt>
            <dd className="mt-1 text-sm text-gray-900">{t(`enums.status.${item.status}`)}</dd>
          </div>
          {item.location && (
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('fields.location.label')}</dt>
              <dd className="mt-1 text-sm text-gray-900">{item.location}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Notes */}
      {item.notes && (
        <div>
          <h2 className="text-xl font-semibold mb-3">{t('sections.notes')}</h2>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold mb-3">{t('sections.metadata')}</h2>
        <dl className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <dt className="font-medium">{tc('createdAt')}</dt>
            <dd className="mt-1">{new Date(item.createdAt).toLocaleString(dateLocale)}</dd>
          </div>
          <div>
            <dt className="font-medium">{tc('updatedAt')}</dt>
            <dd className="mt-1">{new Date(item.updatedAt).toLocaleString(dateLocale)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/**
 * PaddleDetail Component
 *
 * Display component for paddle detail view
 */

import { useLocale, useTranslations } from 'next-intl';
import type { PaddleItem } from '../schema';

export interface PaddleDetailProps {
  item: PaddleItem;
}

export function PaddleDetail({ item }: PaddleDetailProps) {
  const t = useTranslations('paddles');
  const tc = useTranslations('common');
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <p className="text-gray-500 mt-1">
              {t('fields.itemNumber.label')}: #{item.itemNumber}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded text-sm ${
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
        </div>
      </div>

      {/* Basic Information */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('sections.basicInfo')}</h2>
        <dl className="grid grid-cols-2 gap-4">
          {item.bladeBrand && (
            <>
              <dt className="text-gray-500">{t('fields.bladeBrand.label')}</dt>
              <dd>{item.bladeBrand}</dd>
            </>
          )}
          {item.bladeModel && (
            <>
              <dt className="text-gray-500">{t('fields.bladeModel.label')}</dt>
              <dd>{item.bladeModel}</dd>
            </>
          )}
          {item.bladeWeightG && (
            <>
              <dt className="text-gray-500">{t('fields.bladeWeightG.label')}</dt>
              <dd>{item.bladeWeightG}g</dd>
            </>
          )}
          {item.handleType && (
            <>
              <dt className="text-gray-500">{t('fields.handleType.label')}</dt>
              <dd>{t(`enums.handleType.${item.handleType}`)}</dd>
            </>
          )}
        </dl>
      </section>

      {/* Rubber Configuration */}
      {(item.forehandRubber || item.backhandRubber || item.rubberThicknessMm) && (
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('sections.rubber')}</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.forehandRubber && (
              <>
                <dt className="text-gray-500">{t('fields.forehandRubber.label')}</dt>
                <dd>{item.forehandRubber}</dd>
              </>
            )}
            {item.backhandRubber && (
              <>
                <dt className="text-gray-500">{t('fields.backhandRubber.label')}</dt>
                <dd>{item.backhandRubber}</dd>
              </>
            )}
            {item.rubberThicknessMm && (
              <>
                <dt className="text-gray-500">{t('fields.rubberThicknessMm.label')}</dt>
                <dd>{item.rubberThicknessMm}mm</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* Performance Ratings */}
      {(item.bladeSpeed || item.bladeControl) && (
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('sections.performance')}</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.bladeSpeed && (
              <>
                <dt className="text-gray-500">{t('fields.bladeSpeed.label')}</dt>
                <dd>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.bladeSpeed}/10</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.bladeSpeed / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </dd>
              </>
            )}
            {item.bladeControl && (
              <>
                <dt className="text-gray-500">{t('fields.bladeControl.label')}</dt>
                <dd>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.bladeControl}/10</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(item.bladeControl / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* Purchase and Value */}
      {(item.purchaseDate || item.purchasePrice || item.currentValue) && (
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('sections.value')}</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.purchaseDate && (
              <>
                <dt className="text-gray-500">{t('fields.purchaseDate.label')}</dt>
                <dd>{new Date(item.purchaseDate).toLocaleDateString(dateLocale)}</dd>
              </>
            )}
            {item.purchasePrice && (
              <>
                <dt className="text-gray-500">{t('fields.purchasePrice.label')}</dt>
                <dd>¥{item.purchasePrice.toFixed(2)}</dd>
              </>
            )}
            {item.currentValue && (
              <>
                <dt className="text-gray-500">{t('fields.currentValue.label')}</dt>
                <dd>¥{item.currentValue.toFixed(2)}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* Status and Condition */}
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('sections.status')}</h2>
        <dl className="grid grid-cols-2 gap-4">
          {item.condition && (
            <>
              <dt className="text-gray-500">{t('fields.condition.label')}</dt>
              <dd>{item.condition}</dd>
            </>
          )}
          {item.location && (
            <>
              <dt className="text-gray-500">{t('fields.location.label')}</dt>
              <dd>{item.location}</dd>
            </>
          )}
        </dl>
      </section>

      {/* Notes */}
      {item.notes && (
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('sections.notes')}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{item.notes}</p>
        </section>
      )}

      {/* Timestamps */}
      <section className="text-sm text-gray-500 border-t pt-4">
        <div className="flex justify-between">
          <span>
            {tc('createdAt')}: {new Date(item.createdAt).toLocaleString(dateLocale)}
          </span>
          <span>
            {tc('updatedAt')}: {new Date(item.updatedAt).toLocaleString(dateLocale)}
          </span>
        </div>
      </section>
    </div>
  );
}

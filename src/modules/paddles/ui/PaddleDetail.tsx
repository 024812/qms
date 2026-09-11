/**
 * PaddleDetail Component
 *
 * Display component for paddle detail view
 */

import type { PaddleItem } from '../schema';

export interface PaddleDetailProps {
  item: PaddleItem;
}

export function PaddleDetail({ item }: PaddleDetailProps) {
  const statusMap: Record<string, string> = {
    ACTIVE: '使用中',
    RETIRED: '已退役',
    FOR_SALE: '待售',
    SOLD: '已售出',
    DISPLAY: '展示',
  };

  const handleMap: Record<string, string> = {
    FL: '横拍',
    ST: '直拍',
    CS: '中式直拍',
    AN: '解剖',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{item.name}</h1>
            <p className="text-gray-500 mt-1">物品编号: #{item.itemNumber}</p>
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
            {statusMap[item.status] || item.status}
          </span>
        </div>
      </div>

      {/* Basic Information */}
      <section>
        <h2 className="text-lg font-semibold mb-3">基本信息</h2>
        <dl className="grid grid-cols-2 gap-4">
          {item.bladeBrand && (
            <>
              <dt className="text-gray-500">底板品牌</dt>
              <dd>{item.bladeBrand}</dd>
            </>
          )}
          {item.bladeModel && (
            <>
              <dt className="text-gray-500">底板型号</dt>
              <dd>{item.bladeModel}</dd>
            </>
          )}
          {item.bladeWeightG && (
            <>
              <dt className="text-gray-500">底板重量</dt>
              <dd>{item.bladeWeightG}g</dd>
            </>
          )}
          {item.handleType && (
            <>
              <dt className="text-gray-500">握拍方式</dt>
              <dd>{handleMap[item.handleType] || item.handleType}</dd>
            </>
          )}
        </dl>
      </section>

      {/* Rubber Configuration */}
      {(item.forehandRubber || item.backhandRubber || item.rubberThicknessMm) && (
        <section>
          <h2 className="text-lg font-semibold mb-3">胶皮配置</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.forehandRubber && (
              <>
                <dt className="text-gray-500">正手胶皮</dt>
                <dd>{item.forehandRubber}</dd>
              </>
            )}
            {item.backhandRubber && (
              <>
                <dt className="text-gray-500">反手胶皮</dt>
                <dd>{item.backhandRubber}</dd>
              </>
            )}
            {item.rubberThicknessMm && (
              <>
                <dt className="text-gray-500">海绵厚度</dt>
                <dd>{item.rubberThicknessMm}mm</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* Performance Ratings */}
      {(item.bladeSpeed || item.bladeControl) && (
        <section>
          <h2 className="text-lg font-semibold mb-3">性能评分</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.bladeSpeed && (
              <>
                <dt className="text-gray-500">速度</dt>
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
                <dt className="text-gray-500">控制</dt>
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
          <h2 className="text-lg font-semibold mb-3">购买与估值</h2>
          <dl className="grid grid-cols-2 gap-4">
            {item.purchaseDate && (
              <>
                <dt className="text-gray-500">购买日期</dt>
                <dd>{new Date(item.purchaseDate).toLocaleDateString('zh-CN')}</dd>
              </>
            )}
            {item.purchasePrice && (
              <>
                <dt className="text-gray-500">购买价格</dt>
                <dd>¥{item.purchasePrice.toFixed(2)}</dd>
              </>
            )}
            {item.currentValue && (
              <>
                <dt className="text-gray-500">当前估值</dt>
                <dd>¥{item.currentValue.toFixed(2)}</dd>
              </>
            )}
          </dl>
        </section>
      )}

      {/* Status and Condition */}
      <section>
        <h2 className="text-lg font-semibold mb-3">状态与存放</h2>
        <dl className="grid grid-cols-2 gap-4">
          {item.condition && (
            <>
              <dt className="text-gray-500">物理状况</dt>
              <dd>{item.condition}</dd>
            </>
          )}
          {item.location && (
            <>
              <dt className="text-gray-500">存放位置</dt>
              <dd>{item.location}</dd>
            </>
          )}
        </dl>
      </section>

      {/* Notes */}
      {item.notes && (
        <section>
          <h2 className="text-lg font-semibold mb-3">备注</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{item.notes}</p>
        </section>
      )}

      {/* Timestamps */}
      <section className="text-sm text-gray-500 border-t pt-4">
        <div className="flex justify-between">
          <span>创建时间: {new Date(item.createdAt).toLocaleString('zh-CN')}</span>
          <span>更新时间: {new Date(item.updatedAt).toLocaleString('zh-CN')}</span>
        </div>
      </section>
    </div>
  );
}

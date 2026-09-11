/**
 * PaddleCard Component
 *
 * Display component for paddle items in list view
 */

import type { PaddleItem } from '../schema';

export interface PaddleCardProps {
  item: PaddleItem;
  onClick?: () => void;
}

export function PaddleCard({ item, onClick }: PaddleCardProps) {
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
            <span className="text-gray-500">重量:</span> {item.bladeWeightG}g
          </div>
        )}
        {item.handleType && (
          <div>
            <span className="text-gray-500">握拍:</span>{' '}
            {handleMap[item.handleType] || item.handleType}
          </div>
        )}
        {item.bladeSpeed && (
          <div>
            <span className="text-gray-500">速度:</span> {item.bladeSpeed}/10
          </div>
        )}
        {item.bladeControl && (
          <div>
            <span className="text-gray-500">控制:</span> {item.bladeControl}/10
          </div>
        )}
      </div>

      {(item.forehandRubber || item.backhandRubber) && (
        <div className="mt-3 text-sm">
          {item.forehandRubber && (
            <div>
              <span className="text-gray-500">正手:</span> {item.forehandRubber}
            </div>
          )}
          {item.backhandRubber && (
            <div>
              <span className="text-gray-500">反手:</span> {item.backhandRubber}
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
          {statusMap[item.status] || item.status}
        </span>
        {item.location && <span className="text-xs text-gray-500">{item.location}</span>}
      </div>
    </div>
  );
}

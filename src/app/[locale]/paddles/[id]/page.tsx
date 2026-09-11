import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { requirePageModuleAccess } from '@/lib/module-access';
import { getPaddleAction } from '@/app/actions/paddles';
import { PaddleDetail } from '@/modules/paddles/ui/PaddleDetail';
import Link from 'next/link';

export default async function PaddleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  requirePageModuleAccess(await auth(), 'paddles');

  const result = await getPaddleAction(id);

  if (!result.success) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link href="/paddles" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          ← 返回列表
        </Link>
      </div>

      {/* Detail Component */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <PaddleDetail item={result.data} />
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <Link
          href={`/paddles/${id}/edit`}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          编辑
        </Link>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          onClick={() => {
            if (confirm('确定要删除这个底板吗？')) {
              // Handle delete
            }
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}

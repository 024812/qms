/**
 * Debug page to test users API
 */

import { auth } from '@/auth';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export default async function DebugUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    return <div className="p-8">需要管理员权限</div>;
  }

  let users: any[] = [];
  let error: any = null;
  let rawResult: any = null;

  try {
    // Direct database query
    const result = await db.execute(sql`
      SELECT id, name, email, role, created_at
      FROM "user"
      ORDER BY created_at
    `);

    rawResult = result;
    users = result.rows;
  } catch (err) {
    error = err;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">用户调试页面</h1>

      <div className="space-y-4">
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">当前会话</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        {error && (
          <div className="border border-red-500 rounded p-4 bg-red-50">
            <h2 className="font-semibold mb-2 text-red-700">错误</h2>
            <pre className="text-xs text-red-600">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">原始查询结果</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
            {JSON.stringify(rawResult, null, 2)}
          </pre>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">用户列表 ({users.length} 个用户)</h2>
          {users.length === 0 ? (
            <p className="text-gray-500">没有找到用户</p>
          ) : (
            <div className="space-y-2">
              {users.map((user: any) => (
                <div key={user.id} className="border-b pb-2">
                  <div className="font-medium">{user.name || '(无名称)'}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500">
                    角色: {user.role} | ID: {user.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">数据库连接信息</h2>
          <div className="text-sm space-y-1">
            <div>DATABASE_URL 已设置: {process.env.DATABASE_URL ? '是' : '否'}</div>
            <div>
              DATABASE_URL 前缀:{' '}
              {process.env.DATABASE_URL?.substring(0, 30)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

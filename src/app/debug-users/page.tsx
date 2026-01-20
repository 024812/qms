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
  let tables: any[] = [];
  let tablesError: any = null;
  let usersColumns: any[] = [];
  let columnsError: any = null;

  // First, check what tables exist
  try {
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    tables = tablesResult.rows;
  } catch (err) {
    tablesError = err;
  }

  // Check columns in users table
  try {
    const columnsResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    usersColumns = columnsResult.rows;
  } catch (err) {
    columnsError = err;
  }

  // Try to query users from "users" table (plural)
  try {
    const result = await db.execute(sql`
      SELECT *
      FROM "users"
      LIMIT 10
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

        <div className="border rounded p-4 bg-blue-50">
          <h2 className="font-semibold mb-2">数据库中的表</h2>
          {tablesError ? (
            <pre className="text-xs text-red-600">
              {JSON.stringify(tablesError, null, 2)}
            </pre>
          ) : (
            <div className="space-y-1">
              {tables.length === 0 ? (
                <p className="text-gray-500">没有找到表</p>
              ) : (
                tables.map((table: any) => (
                  <div key={table.table_name} className="text-sm font-mono">
                    • {table.table_name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="border rounded p-4 bg-green-50">
          <h2 className="font-semibold mb-2">users 表的列结构</h2>
          {columnsError ? (
            <pre className="text-xs text-red-600">
              {JSON.stringify(columnsError, null, 2)}
            </pre>
          ) : (
            <div className="space-y-1">
              {usersColumns.length === 0 ? (
                <p className="text-gray-500">没有找到列</p>
              ) : (
                <table className="text-xs w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-1">列名</th>
                      <th className="text-left p-1">数据类型</th>
                      <th className="text-left p-1">可为空</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersColumns.map((col: any) => (
                      <tr key={col.column_name} className="border-b">
                        <td className="p-1 font-mono font-semibold">{col.column_name}</td>
                        <td className="p-1">{col.data_type}</td>
                        <td className="p-1">{col.is_nullable}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="border border-red-500 rounded p-4 bg-red-50">
            <h2 className="font-semibold mb-2 text-red-700">查询 "users" 表时出错</h2>
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

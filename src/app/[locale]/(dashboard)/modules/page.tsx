/**
 * Module Selector Page
 * 
 * Displays all available modules and allows users to subscribe/unsubscribe.
 * 
 * Requirements: 5.1, 8.2
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ModuleSelector } from './ModuleSelector';
import { connection } from 'next/server';


export default async function ModulesPage() {
  // Opt-in to dynamic rendering for auth check
  await connection();
  
  const session = await auth();


  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">模块管理</h1>
          <p className="text-muted-foreground">
            选择您想要使用的功能模块。您可以随时订阅或取消订阅模块。
          </p>
        </div>

        <ModuleSelector />
      </div>
    </div>
  );
}

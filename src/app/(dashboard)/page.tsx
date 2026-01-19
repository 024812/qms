import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardContent } from './DashboardContent';
import { ModuleSelector } from './modules/ModuleSelector';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const activeModules = (session.user.activeModules as string[]) || [];

  // If user has no modules, show module selector
  if (activeModules.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">欢迎使用物品管理系统</h1>
            <p className="text-muted-foreground">
              请选择您想要使用的功能模块开始管理您的物品
            </p>
          </div>
          <ModuleSelector />
        </div>
      </div>
    );
  }

  // If user has multiple modules, show module selector
  if (activeModules.length > 1) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">选择模块</h1>
            <p className="text-muted-foreground">
              您订阅了多个模块，请选择要访问的模块
            </p>
          </div>
          <ModuleSelector />
        </div>
      </div>
    );
  }

  // If user has exactly one module, middleware will redirect to that module
  // This code should not be reached, but just in case:
  return <DashboardContent />;
}

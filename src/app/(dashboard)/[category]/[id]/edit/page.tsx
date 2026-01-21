/**
 * Dynamic Module Edit Item Page
 *
 * This page provides a form to edit an existing item for any registered module.
 * Uses Next.js 16 useActionState hook for progressive enhancement.
 *
 * Following Next.js 16 best practices from Context7:
 * - Pass Server Action directly to form (no inline wrapper)
 * - Server Action handles all validation and error handling
 * - Form component uses useActionState for state management
 *
 * Requirements: 3.1, 3.3, 5.1, 8.2
 *
 * Reference: https://nextjs.org/docs/app/guides/forms
 */

import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getModule } from '@/modules/registry';
import { getItemById, updateItem } from '@/app/actions/items';
import { ItemForm } from '@/modules/core/ui/ItemForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    category: string;
    id: string;
  }>;
}

export default async function EditItemPage(props: PageProps) {
  // Await params (Next.js 15+ requirement)
  const params = await props.params;
  
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  // Get module configuration
  const moduleConfig = getModule(params.category);
  if (!moduleConfig) {
    return notFound();
  }

  // Fetch item
  let item;
  try {
    item = await getItemById(params.category, params.id);
  } catch {
    return notFound();
  }

  // Verify item exists
  if (!item) {
    return notFound();
  }

  // Get display name (handle generic types)
  const itemName = (item as any).name || (item as any).playerName || 'Item';

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/${params.category}/${params.id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回详情
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">编辑{moduleConfig.name}</h1>
        <p className="text-muted-foreground mt-1">修改 {itemName} 的信息</p>
      </div>

      {/* Form - Pass Server Action directly (Next.js 16 best practice) */}
      <div className="bg-card border rounded-lg p-6">
        <ItemForm
          moduleType={params.category}
          initialData={item as any}
          action={updateItem}
          redirectPath={`/${params.category}/${params.id}`}
        />
      </div>
    </div>
  );
}

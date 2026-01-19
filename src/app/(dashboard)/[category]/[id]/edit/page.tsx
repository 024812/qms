/**
 * Dynamic Module Edit Item Page
 * 
 * This page provides a form to edit an existing item for any registered module.
 * It uses Next.js 16 Form component for progressive enhancement.
 * 
 * Requirements: 3.1, 3.3
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getModule } from '@/modules/registry';
import { getItemById, updateItem } from '@/app/actions/items';
import { ItemForm } from '@/modules/core/ui/ItemForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    category: string;
    id: string;
  };
}

export default async function EditItemPage({ params }: PageProps) {
  // Verify authentication
  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  // Get module configuration
  const module = getModule(params.category);
  if (!module) {
    return notFound();
  }

  // Fetch item
  let item;
  try {
    item = await getItemById(params.id);
  } catch (error) {
    return notFound();
  }

  // Verify item type matches category
  if (item.type !== params.category) {
    return notFound();
  }

  // Server action to handle form submission
  async function handleSubmit(formData: FormData) {
    'use server';

    // Re-fetch module in server action context
    const actionModule = getModule(params.category);
    if (!actionModule) {
      throw new Error(`Module ${params.category} not found`);
    }

    const name = formData.get('name') as string;
    const status = formData.get('status') as 'in_use' | 'storage' | 'maintenance' | 'lost';

    // Collect attributes from form data
    const attributes: Record<string, any> = {};
    for (const field of actionModule.formFields) {
      const value = formData.get(`attributes.${field.name}`);
      if (value !== null && value !== '') {
        // Convert to appropriate type
        if (field.type === 'number') {
          attributes[field.name] = parseFloat(value as string);
        } else if (field.type === 'date') {
          attributes[field.name] = value as string;
        } else {
          attributes[field.name] = value;
        }
      }
    }

    // Update item
    await updateItem(params.id, {
      name,
      status,
      attributes,
    });

    // Redirect to item detail page
    redirect(`/${params.category}/${params.id}`);
  }

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
        <h1 className="text-3xl font-bold">编辑{module.name}</h1>
        <p className="text-muted-foreground mt-1">
          修改 {item.name} 的信息
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border rounded-lg p-6">
        <ItemForm
          moduleType={params.category}
          initialData={item}
          action={handleSubmit}
          onCancel={() => redirect(`/${params.category}/${params.id}`)}
        />
      </div>
    </div>
  );
}

/**
 * Dynamic Module New Item Page
 * 
 * This page provides a form to create a new item for any registered module.
 * It uses Next.js 16 Form component for progressive enhancement.
 * 
 * Requirements: 3.1, 3.3
 */

import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getModule } from '@/modules/registry';
import { createItem } from '@/app/actions/items';
import { ItemForm } from '@/modules/core/ui/ItemForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: {
    category: string;
  };
}

export default async function NewItemPage({ params }: PageProps) {
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

  // Server action to handle form submission
  async function handleSubmit(formData: FormData) {
    'use server';

    // Re-fetch module in server action context
    const actionModule = getModule(params.category);
    if (!actionModule) {
      throw new Error(`Module ${params.category} not found`);
    }

    const name = formData.get('name') as string;

    // Collect attributes from form data
    const attributes: Record<string, any> = {};
    for (const field of actionModule.formFields) {
      const value = formData.get(`attributes.${field.name}`);
      if (value) {
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

    // Create item
    const item = await createItem({
      type: params.category,
      name,
      attributes,
    });

    // Redirect to item detail page
    redirect(`/${params.category}/${item.id}`);
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/${params.category}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">新建{module.name}</h1>
        <p className="text-muted-foreground mt-1">
          填写以下信息创建新的{module.name}
        </p>
      </div>

      {/* Form */}
      <div className="bg-card border rounded-lg p-6">
        <ItemForm
          moduleType={params.category}
          action={handleSubmit}
          onCancel={() => redirect(`/${params.category}`)}
        />
      </div>
    </div>
  );
}

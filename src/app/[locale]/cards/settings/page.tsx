'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, ShieldAlert, Key, Server, Box, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useCardSettings, useUpdateCardSettings } from '@/hooks/useCardSettings';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const settingsSchema = z.object({
  azureOpenAIApiKey: z.string().optional(),
  azureOpenAIEndpoint: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  azureOpenAIDeployment: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function CardSettingsPage() {
  const locale = useLocale();
  const language = locale;
  const { data: session, status } = useSession();

  const { data: settings, isLoading } = useCardSettings();
  const updateSettings = useUpdateCardSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      azureOpenAIApiKey: '',
      azureOpenAIEndpoint: '',
      azureOpenAIDeployment: '',
    },
  });

  // Reset form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.reset({
        azureOpenAIApiKey: settings.azureOpenAIApiKey || '',
        azureOpenAIEndpoint: settings.azureOpenAIEndpoint || '',
        azureOpenAIDeployment: settings.azureOpenAIDeployment || '',
      });
    }
  }, [settings, form]);

  const isAdmin = session?.user?.role === 'admin';

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await updateSettings.mutateAsync(data);
      toast.success(language === 'zh' ? '设置已保存' : 'Settings saved');
    } catch (error) {
      toast.error(language === 'zh' ? '保存失败' : 'Save failed');
      console.error(error);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Non-admin access denied
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-6 h-6" />
                {language === 'zh' ? '访问被拒绝' : 'Access Denied'}
              </CardTitle>
              <CardDescription>
                {language === 'zh'
                  ? '只有管理员可以访问球星卡管理设置。'
                  : 'Only administrators can access card management settings.'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            {language === 'zh' ? '球星卡管理设置' : 'Card Management Settings'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'zh'
              ? '配置球星卡模块的AI服务（仅管理员）'
              : 'Configure card module AI services (Admin only)'}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Azure OpenAI Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Azure OpenAI Configuration</span>
                </CardTitle>
                <CardDescription>
                  {language === 'zh'
                    ? '配置用于卡片识别和分析的 Azure OpenAI 服务'
                    : 'Configure Azure OpenAI service for card recognition and analysis'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="azureOpenAIEndpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        Endpoint URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://resource-name.openai.azure.com/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The base URL for your Azure OpenAI resource.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="azureOpenAIApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        API Key
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={
                            settings?.azureOpenAIApiKey?.includes('*')
                              ? '********'
                              : 'Enter API Key'
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your Azure OpenAI API Key. Leave blank to keep unchanged.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="azureOpenAIDeployment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        Deployment Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. gpt-4o, gpt-5-mini" {...field} />
                      </FormControl>
                      <FormDescription>
                        The model deployment name to use (e.g. gpt-4o).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {language === 'zh' ? '保存设置' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}

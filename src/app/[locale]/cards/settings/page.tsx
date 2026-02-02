'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('cards.settings');
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
      toast.success(t('success'));
    } catch (error) {
      toast.error(t('error'));
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
                {t('accessDenied')}
              </CardTitle>
              <CardDescription>{t('accessDeniedDesc')}</CardDescription>
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
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Azure OpenAI Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>{t('azure.title')}</span>
                </CardTitle>
                <CardDescription>{t('azure.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="azureOpenAIEndpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        {t('azure.endpoint')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t('azure.endpointPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>{t('azure.endpointDesc')}</FormDescription>
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
                        {t('azure.apiKey')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={
                            settings?.azureOpenAIApiKey?.includes('*')
                              ? t('azure.apiKeyMasked')
                              : t('azure.apiKeyPlaceholder')
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('azure.apiKeyDesc')}</FormDescription>
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
                        {t('azure.deployment')}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder={t('azure.deploymentPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>{t('azure.deploymentDesc')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {t('save')}
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

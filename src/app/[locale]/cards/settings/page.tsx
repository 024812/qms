'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, ShieldAlert, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useCardSettings, useUpdateCardSettings } from '@/hooks/useCardSettings';
import { useEffect, useState } from 'react';

export default function CardSettingsPage() {
  const locale = useLocale();
  const isZh = locale === 'zh';
  const { data: session, status } = useSession();

  // Fetch settings
  const { data: settings, isLoading } = useCardSettings();
  const updateSettings = useUpdateCardSettings();

  // Local state for form
  const [formData, setFormData] = useState({
    azureOpenAIApiKey: '',
    azureOpenAIEndpoint: '',
    azureOpenAIDeployment: '',
    ebayAppId: '',
    ebayCertId: '',
    ebayDevId: '',
    rapidApiKey: '',
    tavilyApiKey: '',
  });

  // Load data into form when fetched
  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line
      setFormData({
        azureOpenAIApiKey: settings.azureOpenAIApiKey || '',
        azureOpenAIEndpoint: settings.azureOpenAIEndpoint || '',
        azureOpenAIDeployment: settings.azureOpenAIDeployment || '',
        ebayAppId: settings.ebayAppId || '',
        ebayCertId: settings.ebayCertId || '',
        ebayDevId: settings.ebayDevId || '',
        rapidApiKey: settings.rapidApiKey || '',
        tavilyApiKey: settings.tavilyApiKey || '',
      });
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success(isZh ? '设置已保存' : 'Settings saved');
    } catch (error) {
      toast.error(isZh ? '保存失败' : 'Failed to save settings');
      console.error(error);
    }
  };

  const isAdmin = session?.user?.role === 'admin';

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

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-6 h-6" />
                {isZh ? '访问被拒绝' : 'Access Denied'}
              </CardTitle>
              <CardDescription>
                {isZh
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
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            {isZh ? '球星卡管理设置' : 'Card Management Settings'}
          </h1>
          <p className="text-muted-foreground">
            {isZh
              ? '配置球星卡模块的API集成和行为（仅管理员）'
              : 'Configure card module API integrations and behavior (Admin only)'}
          </p>
        </div>

        {/* API-NBA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>NBA API Free Data (RapidAPI)</CardTitle>
            <CardDescription>
              {isZh
                ? '配置 RapidAPI Key 以获取最新的球员数据（NBA API Free Data）'
                : 'Configure RapidAPI Key for latest player stats (NBA API Free Data)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rapidApiKey">RapidAPI Key</Label>
              <Input
                id="rapidApiKey"
                name="rapidApiKey"
                type="password"
                value={formData.rapidApiKey}
                onChange={handleChange}
                placeholder={settings?.rapidApiKey ? '********' : 'Enter Rapid API Key'}
              />
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              <a
                href="https://rapidapi.com/flfranceschi/api/nba-api-free-data"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {isZh ? '获取 RapidAPI Key' : 'Get RapidAPI Key'}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Tavily Search API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Tavily Search API</CardTitle>
            <CardDescription>
              {isZh
                ? '配置 Tavily API Key 作为搜索数据源（对接 Azure OpenAI 生成分析）'
                : 'Configure Tavily API Key for stats search (combined with Azure OpenAI)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tavilyApiKey">Tavily API Key</Label>
              <Input
                id="tavilyApiKey"
                name="tavilyApiKey"
                type="password"
                value={formData.tavilyApiKey}
                onChange={handleChange}
                placeholder={settings?.tavilyApiKey ? '********' : 'tvly-...'}
              />
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              <a
                href="https://tavily.com/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {isZh ? '获取 Tavily API Key' : 'Get Tavily API Key'}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* eBay Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>eBay API Integration</CardTitle>
            <CardDescription>
              {isZh
                ? '配置 eBay 开发者凭证以获取且市场价格数据'
                : 'Configure eBay Developer credentials for market data'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ebayAppId">App ID (Client ID)</Label>
              <Input
                id="ebayAppId"
                name="ebayAppId"
                value={formData.ebayAppId}
                onChange={handleChange}
                placeholder="Enter eBay App ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebayCertId">Cert ID (Client Secret)</Label>
              <Input
                id="ebayCertId"
                name="ebayCertId"
                type="password"
                value={formData.ebayCertId}
                onChange={handleChange}
                placeholder={settings?.ebayCertId ? '********' : 'Enter eBay Cert ID'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ebayDevId">Dev ID (Optional)</Label>
              <Input
                id="ebayDevId"
                name="ebayDevId"
                value={formData.ebayDevId}
                onChange={handleChange}
                placeholder="Enter eBay Dev ID"
              />
            </div>
            <div className="text-sm text-muted-foreground pt-2">
              <a
                href="https://developer.ebay.com/my/keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {isZh ? '获取 eBay API Keys' : 'Get eBay API Keys'}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Azure OpenAI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Azure OpenAI (AI Scanning)</CardTitle>
            <CardDescription>
              {isZh
                ? '配置用于卡片识别和估价的 AI 模型'
                : 'Configure AI model for card recognition and valuation'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="azureOpenAIApiKey">API Key</Label>
              <Input
                id="azureOpenAIApiKey"
                name="azureOpenAIApiKey"
                type="password"
                value={formData.azureOpenAIApiKey}
                onChange={handleChange}
                placeholder={settings?.azureOpenAIApiKey ? '********' : 'Enter Azure OpenAI Key'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azureOpenAIEndpoint">Endpoint URL</Label>
              <Input
                id="azureOpenAIEndpoint"
                name="azureOpenAIEndpoint"
                value={formData.azureOpenAIEndpoint}
                onChange={handleChange}
                placeholder="https://resource-name.openai.azure.com/"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azureOpenAIDeployment">Deployment Name (Model)</Label>
              <Input
                id="azureOpenAIDeployment"
                name="azureOpenAIDeployment"
                value={formData.azureOpenAIDeployment}
                onChange={handleChange}
                placeholder="gpt-4o"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isZh ? '保存所有设置' : 'Save All Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

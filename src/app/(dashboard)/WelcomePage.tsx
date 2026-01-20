'use client';

/**
 * Welcome Page Component
 * 
 * Displays a welcoming homepage for new users with system overview
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export function WelcomePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            欢迎来到物品管理系统
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              智能化物品管理
            </span>
            <br />
            <span className="text-foreground">让收藏管理更简单</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            专业的物品管理平台，帮助您轻松管理被子、球星卡等各类收藏品。
            实时追踪、数据分析、价值评估，一站式解决您的管理需求。
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/modules">
                开始使用
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/settings">系统设置</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle>多模块管理</CardTitle>
              <CardDescription>
                支持被子管理、球星卡管理等多个功能模块，满足不同收藏需求
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle>价值追踪</CardTitle>
              <CardDescription>
                实时追踪物品价值变化，提供市场数据参考，助您做出明智决策
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-500" />
              </div>
              <CardTitle>数据分析</CardTitle>
              <CardDescription>
                强大的数据分析功能，使用统计、趋势图表，让数据一目了然
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>
                简洁直观的操作界面，支持批量导入导出，提升管理效率
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <CardTitle>安全可靠</CardTitle>
              <CardDescription>
                企业级数据安全保障，支持数据备份恢复，保护您的珍贵数据
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-cyan-500" />
              </div>
              <CardTitle>多用户协作</CardTitle>
              <CardDescription>
                支持多用户管理，灵活的权限控制，适合团队协作使用
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Start Section */}
        <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-background border-2">
          <CardHeader>
            <CardTitle className="text-2xl">快速开始</CardTitle>
            <CardDescription className="text-base">
              三步开启您的物品管理之旅
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="font-semibold text-lg">选择模块</h3>
                <p className="text-sm text-muted-foreground">
                  根据您的需求选择被子管理或球星卡管理模块
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="font-semibold text-lg">添加物品</h3>
                <p className="text-sm text-muted-foreground">
                  录入您的物品信息，支持批量导入和手动添加
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="font-semibold text-lg">开始管理</h3>
                <p className="text-sm text-muted-foreground">
                  使用强大的管理功能，追踪、分析、优化您的收藏
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button size="lg" asChild>
                <Link href="/modules">
                  立即开始
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">2+</div>
              <div className="text-sm text-muted-foreground mt-1">功能模块</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground mt-1">数据安全</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground mt-1">随时访问</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground mt-1">无限存储</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

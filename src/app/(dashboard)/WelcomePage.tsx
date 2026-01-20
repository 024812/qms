'use client';

/**
 * Welcome Page Component
 *
 * A clean, concise dashboard homepage for authenticated users.
 * Focuses on quick access to core modules and minimal system status.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, BarChart3, Settings, ArrowRight, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-provider';

export function WelcomePage() {
  const { t } = useLanguage();

  const quickLinks = [
    {
      title: t('quilts.title') || 'Manage Quilts',
      description: 'View, edit, and track your quilt collection.',
      icon: Package,
      href: '/modules',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      action: 'View List',
    },
    {
      title: t('nav.analytics') || 'Analytics',
      description: 'Insights into your collection value and usage.',
      icon: BarChart3,
      href: '/analytics',
      color: 'text-cta',
      bgColor: 'bg-cta/10',
      action: 'View Reports',
    },
    {
      title: t('nav.settings') || 'System Settings',
      description: 'Configure preferences and system options.',
      icon: Settings,
      href: '/settings',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      action: 'Configure',
    },
  ];

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      {/* Header Section */}
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-heading mb-3">
          Welcome to QMS
        </h1>
        <p className="text-lg text-muted-foreground flex items-center justify-center md:justify-start gap-2">
          Simple, intelligent collection management.
        </p>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {quickLinks.map(link => (
          <Card
            key={link.href}
            className="group hover:shadow-md transition-all duration-200 border-muted/60"
          >
            <CardHeader>
              <div
                className={`w-12 h-12 rounded-xl ${link.bgColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-105`}
              >
                <link.icon className={`w-6 h-6 ${link.color}`} />
              </div>
              <CardTitle className="text-xl font-heading">{link.title}</CardTitle>
              <CardDescription className="line-clamp-2">{link.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="group/btn p-0 h-auto hover:bg-transparent hover:text-primary"
                asChild
              >
                <Link href={link.href} className="flex items-center">
                  {link.action}
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Actions / Shortcuts */}
      <div className="rounded-2xl border bg-muted/30 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-semibold text-foreground">Common Actions</h3>
          <p className="text-sm text-muted-foreground">Quick tasks you might want to perform.</p>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="bg-background shadow-sm hover:border-primary/50"
            asChild
          >
            <Link href="/modules?action=add">
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </Link>
          </Button>
          <Button
            variant="outline"
            className="bg-background shadow-sm hover:border-primary/50"
            asChild
          >
            {/* Assuming a search functionality or page mainly exists at /modules with query */}
            <Link href="/modules?focus=search">
              <Search className="w-4 h-4 mr-2" />
              Search Database
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

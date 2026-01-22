/**
 * Weather Forecast Component
 *
 * Displays 7-day weather forecast
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  RefreshCw,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { type WeatherForecast } from '@/lib/weather-service';
import { useLocale, useTranslations } from 'next-intl';

interface WeatherForecastProps {
  className?: string;
}

export function WeatherForecastWidget({ className }: WeatherForecastProps) {
  const locale = useLocale();
  const t = useTranslations();
  const language = locale; // Adapter for existing logic if strictly needed, though logic below uses locale directly or language checks
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiLocale = locale === 'zh' ? 'zh-CN' : 'en-US';

  const fetchForecast = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/weather');
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const result = await response.json();

      // Handle new unified API response format
      if (result.success && result.data) {
        setForecast(result.data.weather?.forecast || result.data.forecast || []);
      } else {
        // Fallback for old format
        setForecast(result.forecast || []);
      }
    } catch {
      setError(t('weather.failedToFetch'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const getWeatherIcon = (iconCode: string, size: string = 'w-8 h-8') => {
    if (iconCode.includes('01')) return <Sun className={`${size} text-yellow-500`} />;
    if (iconCode.includes('02') || iconCode.includes('03'))
      return <Cloud className={`${size} text-muted-foreground`} />;
    if (iconCode.includes('09') || iconCode.includes('10'))
      return <CloudRain className={`${size} text-blue-500`} />;
    if (iconCode.includes('13')) return <Snowflake className={`${size} text-blue-200`} />;
    return <Cloud className={`${size} text-muted-foreground`} />;
  };

  const getTempTrend = (current: number, next: number) => {
    const diff = next - current;
    if (Math.abs(diff) < 2) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    return <TrendingDown className="w-4 h-4 text-blue-500" />;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchForecast} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common.retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (forecast.length === 0) return null;

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">
              {locale === 'zh' ? '上海 · 未来7天天气' : 'Shanghai · 7-Day Forecast'}
            </h3>
          </div>
          <Button onClick={fetchForecast} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {forecast.map((day, idx) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString(locale, { weekday: 'short' });
            const monthDay = date.toLocaleDateString(locale, { month: 'numeric', day: 'numeric' });
            const isToday = idx === 0;

            return (
              <div
                key={day.date}
                className={`text-center p-3 rounded-lg transition-all ${
                  isToday
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-300 dark:border-blue-700 shadow-md'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  {isToday ? t('common.today') : dayName}
                </div>
                <div className="text-xs text-muted-foreground mb-2">{monthDay}</div>
                <div className="flex justify-center mb-2">
                  {day.icon ? (
                    getWeatherIcon(day.icon, 'w-10 h-10')
                  ) : (
                    <Cloud className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm font-bold text-foreground mb-1">
                  {Math.round(day.maxTemp)}°
                </div>
                <div className="text-xs text-muted-foreground mb-2">{Math.round(day.minTemp)}°</div>
                <div className="text-xs text-muted-foreground truncate" title={day.description}>
                  {day.description}
                </div>
                {idx < forecast.length - 1 && (
                  <div className="flex justify-center mt-2">
                    {getTempTrend(day.avgTemp, forecast[idx + 1].avgTemp)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          {locale === 'zh' ? '数据来源：Open-Meteo' : 'Data source: Open-Meteo'}
        </div>
      </CardContent>
    </Card>
  );
}

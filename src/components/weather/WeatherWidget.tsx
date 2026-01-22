/**
 * Weather Widget Component
 *
 * Displays current weather information
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { formatTemperature, getTemperatureDescription } from '@/lib/weather-service';
import type { CurrentWeather } from '@/types/weather';
import { useTranslations } from 'next-intl';

interface WeatherWidgetProps {
  className?: string;
}

export function WeatherWidget({ className }: WeatherWidgetProps) {
  const t = useTranslations('weather');
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather data
  const fetchWeatherData = async () => {
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
        setWeather(result.data.weather?.current || result.data.current);
      } else {
        // Fallback for old format
        setWeather(result.current);
      }
    } catch {
      setError(t('fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes('01')) return <Sun className="w-8 h-8 text-yellow-500" />;
    if (iconCode.includes('02') || iconCode.includes('03'))
      return <Cloud className="w-8 h-8 text-muted-foreground" />;
    if (iconCode.includes('09') || iconCode.includes('10'))
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (iconCode.includes('13')) return <Snowflake className="w-8 h-8 text-blue-200" />;
    return <Cloud className="w-8 h-8 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            天气信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchWeatherData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('retry')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>{t('location')}</span>
          </div>
          <Button onClick={fetchWeatherData} variant="ghost" size="sm" className="h-8 w-8 p-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {weather.icon ? (
              getWeatherIcon(weather.icon)
            ) : (
              <Cloud className="w-8 h-8 text-muted-foreground" />
            )}
            <div>
              <div className="text-2xl font-bold">{formatTemperature(weather.temperature)}</div>
              <div className="text-sm text-muted-foreground">
                {t('feelsLike')} {formatTemperature(weather.feelsLike)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{weather.description || t('unknown')}</div>
            <div className="text-xs text-muted-foreground">
              {getTemperatureDescription(weather.temperature)}
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-500" />
            <div>
              <div className="text-xs text-muted-foreground">{t('humidity')}</div>
              <div className="font-medium">{weather.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">{t('windSpeed')}</div>
              <div className="font-medium">{weather.windSpeed} m/s</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-500" />
            <div>
              <div className="text-xs text-muted-foreground">{t('pressure')}</div>
              <div className="font-medium">{weather.pressure} hPa</div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center">{t('source')}</div>
      </CardContent>
    </Card>
  );
}

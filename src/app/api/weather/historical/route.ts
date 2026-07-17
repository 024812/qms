/**
 * Historical Weather API Route
 *
 * Fetches historical weather data for a specific date
 *
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 5.4 - Zod validation for all inputs
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createNotFoundResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';
import { requireApiSession } from '@/lib/api/route-auth';
import { rateLimiters, withRateLimit } from '@/lib/rate-limit';

// 上海坐标: 31.2304, 121.4737
const SHANGHAI_LAT = 31.2304;
const SHANGHAI_LON = 121.4737;

// Zod schema for date parameter validation
const historicalWeatherQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '无效的日期格式，请使用 YYYY-MM-DD')
    .refine(date => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    }, '无效的日期'),
});

export async function GET(request: NextRequest) {
  return withRateLimit(request, rateLimiters.api, async () => {
    try {
      const authResult = await requireApiSession();
      if (!authResult.ok) return authResult.response;

      const searchParams = request.nextUrl.searchParams;

      // Validate query parameters using Zod
      const validationResult = historicalWeatherQuerySchema.safeParse({
        date: searchParams.get('date'),
      });

      if (!validationResult.success) {
        return createValidationErrorResponse(
          '日期参数验证失败',
          validationResult.error.flatten().fieldErrors as Record<string, string[]>
        );
      }

      const { date } = validationResult.data;

      // 使用 Open-Meteo Historical Weather API
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${SHANGHAI_LAT}&longitude=${SHANGHAI_LON}&start_date=${date}&end_date=${date}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Asia/Shanghai`,
        { next: { revalidate: 86400 } } // 缓存24小时（历史数据不会改变）
      );

      if (!response.ok) {
        throw new Error('Failed to fetch historical weather data');
      }

      const data = await response.json();

      // 检查是否有数据
      if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
        return createNotFoundResponse('该日期的天气数据');
      }

      return createSuccessResponse({
        historicalWeather: {
          date: data.daily.time[0],
          temperature: {
            max: Math.round(data.daily.temperature_2m_max[0]),
            min: Math.round(data.daily.temperature_2m_min[0]),
          },
          weatherCode: data.daily.weather_code[0],
          location: {
            city: '上海',
            cityEn: 'Shanghai',
          },
        },
      });
    } catch (error) {
      return createInternalErrorResponse('获取历史天气数据失败', error);
    }
  });
}

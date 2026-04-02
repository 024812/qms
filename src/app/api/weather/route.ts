/**
 * Weather API Route
 *
 * Fetches current weather and forecast data
 *
 * Requirements: 5.3 - Consistent API response format
 * Requirements: 5.4 - Zod validation for all inputs
 */

import { z } from 'zod';
import { getCurrentWeather, getWeatherForecast } from '@/lib/weather-service';
import {
  createSuccessResponse,
  createValidationErrorResponse,
  createInternalErrorResponse,
} from '@/lib/api/response';

// Default location: Shanghai, China
const DEFAULT_LATITUDE = 31.2304;
const DEFAULT_LONGITUDE = 121.4737;
const DEFAULT_LOCATION_NAME = '上海';

// Zod schema for weather query parameters
const weatherQuerySchema = z.object({
  lat: z.coerce
    .number()
    .min(-90, '纬度必须在 -90 到 90 之间')
    .max(90, '纬度必须在 -90 到 90 之间')
    .default(DEFAULT_LATITUDE),
  lon: z.coerce
    .number()
    .min(-180, '经度必须在 -180 到 180 之间')
    .max(180, '经度必须在 -180 到 180 之间')
    .default(DEFAULT_LONGITUDE),
  location: z.string().max(100).default(DEFAULT_LOCATION_NAME),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters using Zod
    const validationResult = weatherQuerySchema.safeParse({
      lat: searchParams.get('lat') || undefined,
      lon: searchParams.get('lon') || undefined,
      location: searchParams.get('location') || undefined,
    });

    if (!validationResult.success) {
      return createValidationErrorResponse(
        '天气参数验证失败',
        validationResult.error.flatten().fieldErrors as Record<string, string[]>
      );
    }

    const { lat: latitude, lon: longitude, location: locationName } = validationResult.data;

    // Fetch current weather
    const currentWeather = await getCurrentWeather(latitude, longitude);

    // Fetch forecast
    const forecast = await getWeatherForecast(latitude, longitude);

    return createSuccessResponse({
      weather: {
        current: currentWeather,
        forecast,
        location: {
          name: locationName,
          latitude,
          longitude,
        },
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    return createInternalErrorResponse('获取天气数据失败', error);
  }
}

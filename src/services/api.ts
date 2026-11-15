import { z } from 'zod';
import type { City, DayForecast, HourForecast, Weather } from '../models/weather';

const nullableNumbers = z.array(z.number().nullable());

export const forecastResponseSchema = z.object({
  timezone: z.string(),
  current: z.object({
    time: z.number(),
    temperature_2m: z.number(),
    relative_humidity_2m: z.number(),
    apparent_temperature: z.number(),
    is_day: z.number(),
    precipitation: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
    wind_direction_10m: z.number(),
    pressure_msl: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.number()),
    temperature_2m: nullableNumbers,
    weather_code: nullableNumbers,
    precipitation_probability: nullableNumbers,
    is_day: nullableNumbers,
  }),
  daily: z.object({
    time: z.array(z.number()),
    weather_code: nullableNumbers,
    temperature_2m_max: nullableNumbers,
    temperature_2m_min: nullableNumbers,
    precipitation_probability_max: nullableNumbers,
    precipitation_sum: nullableNumbers,
    wind_speed_10m_max: nullableNumbers,
    uv_index_max: nullableNumbers,
    sunrise: nullableNumbers,
    sunset: nullableNumbers,
  }),
});

const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        admin1: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

export class WeatherRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherRequestError';
  }
}

async function request(url: string, signal?: AbortSignal) {
  const controller = new AbortController();
  const forwardAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', forwardAbort);
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      throw new WeatherRequestError(
        response.status === 429
          ? 'Muitas consultas por agora. Aguarde um instante e tente de novo.'
          : 'O serviço de previsão está indisponível. Tente novamente em instantes.',
      );
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw new WeatherRequestError('Consulta cancelada.');
    if (error instanceof WeatherRequestError) throw error;
    throw new WeatherRequestError(
      controller.signal.aborted
        ? 'A consulta demorou demais. Confira a conexão e tente novamente.'
        : 'Não foi possível conectar. Confira sua internet e tente novamente.',
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const params = new URLSearchParams({ name: query, count: '12', language: 'pt', format: 'json' });
  const parsed = geocodingSchema.safeParse(
    await request(`https://geocoding-api.open-meteo.com/v1/search?${params}`, signal),
  );
  if (!parsed.success)
    throw new WeatherRequestError('A busca retornou dados inválidos. Tente novamente.');
  return (parsed.data.results ?? []).map((city) => ({
    id: String(city.id),
    name: city.name,
    region: city.admin1 ?? '',
    country: city.country ?? '',
    countryCode: city.country_code ?? '',
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: city.timezone ?? 'UTC',
  }));
}

export async function fetchWeather(city: City, signal?: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    timezone: 'auto',
    timeformat: 'unixtime',
    forecast_days: '7',
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl',
    hourly: 'temperature_2m,weather_code,precipitation_probability,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  });
  const parsed = forecastResponseSchema.safeParse(
    await request(`https://api.open-meteo.com/v1/forecast?${params}`, signal),
  );
  if (!parsed.success)
    throw new WeatherRequestError(
      'A previsão retornou dados incompletos. Tente atualizar novamente.',
    );
  const { current, hourly, daily, timezone } = parsed.data;
  const hours: HourForecast[] = hourly.time.flatMap((time, i) => {
    const temperature = hourly.temperature_2m[i];
    const weatherCode = hourly.weather_code[i];
    const precipitationProbability = hourly.precipitation_probability[i];
    const isDay = hourly.is_day[i];
    if (
      temperature == null ||
      weatherCode == null ||
      precipitationProbability == null ||
      isDay == null
    )
      return [];
    return [{ time, temperature, weatherCode, precipitationProbability, isDay: isDay === 1 }];
  });
  const days: DayForecast[] = daily.time.flatMap((time, i) => {
    const weatherCode = daily.weather_code[i];
    const temperatureMax = daily.temperature_2m_max[i];
    const temperatureMin = daily.temperature_2m_min[i];
    const precipitationProbability = daily.precipitation_probability_max[i];
    const precipitationSum = daily.precipitation_sum[i];
    const windSpeed = daily.wind_speed_10m_max[i];
    const uvIndex = daily.uv_index_max[i];
    const sunrise = daily.sunrise[i];
    const sunset = daily.sunset[i];
    if (
      weatherCode == null ||
      temperatureMax == null ||
      temperatureMin == null ||
      precipitationProbability == null ||
      precipitationSum == null ||
      windSpeed == null ||
      uvIndex == null ||
      sunrise == null ||
      sunset == null
    )
      return [];
    return [
      {
        time,
        weatherCode,
        temperatureMax,
        temperatureMin,
        precipitationProbability,
        precipitationSum,
        windSpeed,
        uvIndex,
        sunrise,
        sunset,
      },
    ];
  });
  if (!hours.length || !days.length)
    throw new WeatherRequestError(
      'Ainda não há previsão completa para esta localização. Tente outra cidade.',
    );
  return {
    cityId: city.id,
    timezone,
    fetchedAt: Date.now(),
    current: {
      time: current.time,
      temperature: current.temperature_2m,
      apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      weatherCode: current.weather_code,
      isDay: current.is_day === 1,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      precipitation: current.precipitation,
      pressure: current.pressure_msl,
    },
    hourly: hours,
    daily: days,
  };
}

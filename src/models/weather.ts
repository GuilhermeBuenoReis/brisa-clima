import { z } from 'zod';

export const citySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string(),
  country: z.string(),
  countryCode: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

export const currentSchema = z.object({
  time: z.number(),
  temperature: z.number(),
  apparentTemperature: z.number(),
  humidity: z.number(),
  weatherCode: z.number(),
  isDay: z.boolean(),
  windSpeed: z.number(),
  windDirection: z.number(),
  precipitation: z.number(),
  pressure: z.number(),
});

export const hourSchema = z.object({
  time: z.number(),
  temperature: z.number(),
  weatherCode: z.number(),
  precipitationProbability: z.number(),
  isDay: z.boolean(),
});

export const daySchema = z.object({
  time: z.number(),
  weatherCode: z.number(),
  temperatureMax: z.number(),
  temperatureMin: z.number(),
  precipitationProbability: z.number(),
  precipitationSum: z.number(),
  windSpeed: z.number(),
  uvIndex: z.number(),
  sunrise: z.number(),
  sunset: z.number(),
});

export const weatherSchema = z.object({
  cityId: z.string(),
  timezone: z.string(),
  fetchedAt: z.number(),
  current: currentSchema,
  hourly: z.array(hourSchema).min(1),
  daily: z.array(daySchema).min(1),
});

export const preferencesSchema = z.object({
  temperatureUnit: z.enum(['celsius', 'fahrenheit']),
  windUnit: z.enum(['kmh', 'ms']),
});

export const savedStateSchema = z.object({
  version: z.literal(1),
  selectedCity: citySchema,
  favorites: z.array(citySchema).max(12),
  preferences: preferencesSchema,
});

export type City = z.infer<typeof citySchema>;
export type Weather = z.infer<typeof weatherSchema>;
export type HourForecast = z.infer<typeof hourSchema>;
export type DayForecast = z.infer<typeof daySchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type SavedState = z.infer<typeof savedStateSchema>;
export type WeatherCache = Record<string, Weather>;

export const DEFAULT_CITY: City = {
  id: '3461995',
  name: 'Guarapuava',
  region: 'Paraná',
  country: 'Brasil',
  countryCode: 'BR',
  latitude: -25.3905,
  longitude: -51.4654,
  timezone: 'America/Sao_Paulo',
};

export const SUGGESTED_CITIES: City[] = [
  {
    id: '3464975',
    name: 'Curitiba',
    region: 'Paraná',
    country: 'Brasil',
    countryCode: 'BR',
    latitude: -25.4278,
    longitude: -49.2731,
    timezone: 'America/Sao_Paulo',
  },
  {
    id: '3448439',
    name: 'São Paulo',
    region: 'São Paulo',
    country: 'Brasil',
    countryCode: 'BR',
    latitude: -23.5475,
    longitude: -46.6361,
    timezone: 'America/Sao_Paulo',
  },
  {
    id: '3451190',
    name: 'Rio de Janeiro',
    region: 'Rio de Janeiro',
    country: 'Brasil',
    countryCode: 'BR',
    latitude: -22.9068,
    longitude: -43.1729,
    timezone: 'America/Sao_Paulo',
  },
];

export const DEFAULT_PREFERENCES: Preferences = { temperatureUnit: 'celsius', windUnit: 'kmh' };

export const DEFAULT_STATE: SavedState = {
  version: 1,
  selectedCity: DEFAULT_CITY,
  favorites: [DEFAULT_CITY],
  preferences: DEFAULT_PREFERENCES,
};

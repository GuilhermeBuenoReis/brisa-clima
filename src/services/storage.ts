import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_STATE,
  type SavedState,
  savedStateSchema,
  type WeatherCache,
  weatherSchema,
} from '../models/weather';

export const STATE_KEY = '@brisa/state-v1';
export const CACHE_KEY = '@brisa/weather-v1';

export async function readSavedState(): Promise<SavedState> {
  const raw = await AsyncStorage.getItem(STATE_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = savedStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function writeSavedState(state: SavedState) {
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export async function readWeatherCache(): Promise<WeatherCache> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return {};
  try {
    const parsed = weatherSchema.array().max(20).safeParse(JSON.parse(raw));
    if (!parsed.success) return {};
    return Object.fromEntries(parsed.data.map((weather) => [weather.cityId, weather]));
  } catch {
    return {};
  }
}

export async function writeWeatherCache(cache: WeatherCache) {
  const latest = Object.values(cache)
    .sort((a, b) => b.fetchedAt - a.fetchedAt)
    .slice(0, 20);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(latest));
}

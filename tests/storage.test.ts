import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_STATE, type Weather } from '../src/models/weather';
import {
  CACHE_KEY,
  readSavedState,
  readWeatherCache,
  STATE_KEY,
  writeSavedState,
  writeWeatherCache,
} from '../src/services/storage';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn(), setItem: vi.fn() },
}));

const weather: Weather = {
  cityId: '1',
  timezone: 'America/Sao_Paulo',
  fetchedAt: 1000,
  current: {
    time: 1000,
    temperature: 23,
    apparentTemperature: 22,
    humidity: 60,
    weatherCode: 0,
    isDay: true,
    windSpeed: 12,
    windDirection: 0,
    precipitation: 0,
    pressure: 1015,
  },
  hourly: [
    { time: 1000, temperature: 23, weatherCode: 0, precipitationProbability: 0, isDay: true },
  ],
  daily: [
    {
      time: 1000,
      weatherCode: 0,
      temperatureMax: 26,
      temperatureMin: 15,
      precipitationProbability: 0,
      precipitationSum: 0,
      windSpeed: 15,
      uvIndex: 6,
      sunrise: 0,
      sunset: 1200,
    },
  ],
};

beforeEach(() => {
  vi.mocked(AsyncStorage.getItem).mockReset();
  vi.mocked(AsyncStorage.setItem).mockReset();
});

describe('preferências locais', () => {
  it('inicia em Guarapuava quando não há dados salvos', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    await expect(readSavedState()).resolves.toEqual(DEFAULT_STATE);
  });
  it('recupera a seleção e as preferências salvas', async () => {
    const state = {
      ...DEFAULT_STATE,
      preferences: { temperatureUnit: 'fahrenheit', windUnit: 'ms' },
    };
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(state));
    await expect(readSavedState()).resolves.toEqual(state);
  });
  it.each(['{invalid', '{"version":999}', '{"version":1,"selectedCity":null}'])(
    'trata dados locais corrompidos sem travar: %s',
    async (raw) => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(raw);
      await expect(readSavedState()).resolves.toEqual(DEFAULT_STATE);
    },
  );
  it('grava um estado versionado', async () => {
    await writeSavedState(DEFAULT_STATE);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STATE_KEY, JSON.stringify(DEFAULT_STATE));
  });
  it('propaga falha de armazenamento para a interface informar o usuário', async () => {
    vi.mocked(AsyncStorage.setItem).mockRejectedValue(new Error('Quota exceeded'));
    await expect(writeSavedState(DEFAULT_STATE)).rejects.toThrow('Quota');
  });
});

describe('cache meteorológico', () => {
  it('recupera uma previsão completa por cidade', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([weather]));
    await expect(readWeatherCache()).resolves.toEqual({ '1': weather });
  });
  it.each([null, '{broken', '[{"cityId":"1"}]'])(
    'descarta cache ausente ou inválido: %s',
    async (raw) => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(raw);
      await expect(readWeatherCache()).resolves.toEqual({});
    },
  );
  it('limita o cache às 20 consultas mais recentes', async () => {
    const cache = Object.fromEntries(
      Array.from({ length: 25 }, (_, i) => [
        String(i),
        { ...weather, cityId: String(i), fetchedAt: i },
      ]),
    );
    await writeWeatherCache(cache);
    const saved = JSON.parse(String(vi.mocked(AsyncStorage.setItem).mock.calls[0][1])) as Weather[];
    expect(saved).toHaveLength(20);
    expect(saved[0].cityId).toBe('24');
    expect(saved[19].cityId).toBe('5');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(CACHE_KEY, expect.any(String));
  });
});

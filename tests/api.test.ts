import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CITY } from '../src/models/weather';
import { fetchWeather, searchCities } from '../src/services/api';
import { forecastFixture, geocodingFixture } from './fixtures';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function mockResponse(body: object, status = 200) {
  const mock = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('previsão da Open-Meteo', () => {
  it('normaliza dados atuais, 168 horas e 7 dias', async () => {
    mockResponse(forecastFixture());
    const weather = await fetchWeather(DEFAULT_CITY);
    expect(weather.cityId).toBe(DEFAULT_CITY.id);
    expect(weather.current.temperature).toBe(23);
    expect(weather.current.isDay).toBe(true);
    expect(weather.hourly).toHaveLength(168);
    expect(weather.daily).toHaveLength(7);
    expect(weather.daily[1].precipitationProbability).toBe(80);
  });
  it('solicita UTC em segundos e as unidades de origem fixas', async () => {
    const mock = mockResponse(forecastFixture());
    await fetchWeather(DEFAULT_CITY);
    const url = new URL(String(mock.mock.calls[0][0]));
    expect(url.searchParams.get('latitude')).toBe(String(DEFAULT_CITY.latitude));
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('forecast_days')).toBe('7');
  });
  it('recusa uma resposta incompleta', async () => {
    mockResponse({ current: { temperature_2m: 23 } });
    await expect(fetchWeather(DEFAULT_CITY)).rejects.toThrow('dados incompletos');
  });
  it('ignora horas e dias com valores nulos sem inventar zeros', async () => {
    const fixture = forecastFixture();
    mockResponse({
      ...fixture,
      hourly: {
        ...fixture.hourly,
        temperature_2m: [null, ...fixture.hourly.temperature_2m.slice(1)],
      },
      daily: {
        ...fixture.daily,
        temperature_2m_min: [null, ...fixture.daily.temperature_2m_min.slice(1)],
      },
    });
    const weather = await fetchWeather(DEFAULT_CITY);
    expect(weather.hourly).toHaveLength(167);
    expect(weather.daily).toHaveLength(6);
  });
  it('recusa uma previsão sem dias válidos', async () => {
    const fixture = forecastFixture();
    mockResponse({ ...fixture, daily: { ...fixture.daily, time: [] } });
    await expect(fetchWeather(DEFAULT_CITY)).rejects.toThrow('não há previsão completa');
  });
  it.each([
    [429, 'Muitas consultas'],
    [503, 'indisponível'],
  ])('explica erro HTTP %s', async (status, message) => {
    mockResponse({}, Number(status));
    await expect(fetchWeather(DEFAULT_CITY)).rejects.toThrow(String(message));
  });
  it('explica falha de conexão', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchWeather(DEFAULT_CITY)).rejects.toThrow('Confira sua internet');
  });
  it('aborta uma consulta após 15 segundos', async () => {
    vi.useFakeTimers();
    const mock = vi.fn<typeof fetch>().mockImplementation(
      (_, options) =>
        new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );
    vi.stubGlobal('fetch', mock);
    const assertion = expect(fetchWeather(DEFAULT_CITY)).rejects.toThrow('demorou demais');
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });
  it('cancela requisições antigas', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('AbortError')));
    await expect(fetchWeather(DEFAULT_CITY, controller.signal)).rejects.toThrow('cancelada');
  });
});

describe('busca de cidades', () => {
  it('preserva acentos, fuso e identificação de cada resultado', async () => {
    const mock = mockResponse(geocodingFixture);
    const cities = await searchCities('São Paulo');
    expect(cities[0].id).toBe('3464975');
    expect(cities[0].region).toBe('Paraná');
    expect(new URL(String(mock.mock.calls[0][0])).searchParams.get('name')).toBe('São Paulo');
  });
  it('aceita uma busca sem resultados', async () => {
    mockResponse({ generationtime_ms: 0.5 });
    await expect(searchCities('Cidade inexistente')).resolves.toEqual([]);
  });
  it('lida com metadados opcionais ausentes', async () => {
    mockResponse({ results: [{ id: 1, name: 'Lugar', latitude: 0, longitude: 0 }] });
    const cities = await searchCities('Lugar');
    expect(cities[0].timezone).toBe('UTC');
    expect(cities[0].region).toBe('');
  });
  it('recusa um resultado inválido', async () => {
    mockResponse({ results: [{ name: 'Sem coordenadas' }] });
    await expect(searchCities('Teste')).rejects.toThrow('dados inválidos');
  });
});

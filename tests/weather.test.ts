import { describe, expect, it } from 'vitest';
import type { DayForecast } from '../src/models/weather';
import {
  clockLabel,
  dayLabel,
  describeWeather,
  formatTemperature,
  formatWind,
  hourLabel,
  temperatureValue,
  uvLevel,
  validateCityQuery,
  weatherAdvice,
  windDirection,
} from '../src/utils/weather';

describe('conversões e formatação', () => {
  it.each([
    [0, 32],
    [20, 68],
    [-10, 14],
    [37, 99],
  ])('converte %s °C em %s °F', (celsius, fahrenheit) => {
    expect(temperatureValue(celsius, 'fahrenheit')).toBe(fahrenheit);
  });
  it('mantém Celsius e arredonda valores', () => {
    expect(formatTemperature(23.6, 'celsius')).toBe('24°');
    expect(formatTemperature(-5, 'celsius', true)).toBe('-5°C');
    expect(formatTemperature(0, 'fahrenheit', true)).toBe('32°F');
  });
  it('converte km/h para m/s sem alterar o valor de origem', () => {
    expect(formatWind(36, 'ms')).toBe('10,0 m/s');
    expect(formatWind(18.7, 'kmh')).toBe('19 km/h');
  });
  it.each([
    [0, 'N'],
    [90, 'L'],
    [180, 'S'],
    [270, 'O'],
    [360, 'N'],
    [-90, 'O'],
  ])('interpreta direção %s como %s', (degrees, label) => {
    expect(windDirection(degrees)).toBe(label);
  });
});

describe('condições WMO', () => {
  it.each([
    [0, 'sun'],
    [1, 'partly-cloudy'],
    [2, 'partly-cloudy'],
    [3, 'cloud'],
    [45, 'fog'],
    [48, 'fog'],
    [51, 'rain'],
    [57, 'rain'],
    [61, 'rain'],
    [67, 'rain'],
    [71, 'snow'],
    [86, 'snow'],
    [82, 'rain'],
    [95, 'storm'],
    [99, 'storm'],
  ])('mapeia código %s para %s', (code, kind) => {
    expect(describeWeather(Number(code)).kind).toBe(kind);
  });
  it('diferencia céu limpo de dia e de noite', () => {
    expect(describeWeather(0, false)).toEqual({ label: 'Noite limpa', kind: 'moon' });
  });
  it('lida com um código ainda não conhecido', () => {
    expect(describeWeather(999).label).toBe('Condição indisponível');
  });
});

describe('fusos horários', () => {
  const instant = Date.parse('2026-11-15T01:30:00Z') / 1000;
  it('exibe a hora na cidade, independente do fuso do dispositivo', () => {
    expect(clockLabel(instant, 'America/Sao_Paulo')).toBe('22:30');
    expect(hourLabel(instant, 'Asia/Tokyo')).toBe('10h');
  });
  it('usa a data da cidade para Hoje e Amanhã', () => {
    expect(dayLabel(instant, 'America/Sao_Paulo', instant * 1000)).toBe('Hoje');
    expect(dayLabel(instant + 86400, 'America/Sao_Paulo', instant * 1000)).toBe('Amanhã');
    expect(dayLabel(instant + 172800, 'America/Sao_Paulo', instant * 1000)).toBe('Segunda');
  });
});

describe('validação da busca', () => {
  it.each(['', ' ', 'a', '123', '!!!'])('recusa entrada inválida: %s', (query) => {
    expect(validateCityQuery(query).error).toBeTruthy();
  });
  it('aceita acentos e normaliza espaços', () => {
    expect(validateCityQuery('  São   Paulo  ')).toEqual({ value: 'São Paulo', error: null });
    expect(validateCityQuery('東京').error).toBeNull();
  });
  it('limita o tamanho da busca', () => {
    expect(validateCityQuery('a'.repeat(81)).error).toContain('80');
  });
});

describe('informações do dia', () => {
  const day: DayForecast = {
    time: 0,
    weatherCode: 0,
    temperatureMax: 25,
    temperatureMin: 16,
    precipitationProbability: 0,
    precipitationSum: 0,
    windSpeed: 10,
    uvIndex: 2,
    sunrise: 1,
    sunset: 2,
  };
  it.each([
    [2, 'Baixo'],
    [3, 'Moderado'],
    [6, 'Alto'],
    [8, 'Muito alto'],
    [11, 'Extremo'],
  ])('classifica índice UV %s como %s', (index, label) => {
    expect(uvLevel(Number(index))).toBe(label);
  });
  it('prioriza chuva, depois UV, depois frio', () => {
    expect(weatherAdvice({ ...day, precipitationProbability: 80, uvIndex: 9 }).title).toContain(
      'guarda-chuva',
    );
    expect(weatherAdvice({ ...day, uvIndex: 9 }).title).toContain('Sol');
    expect(weatherAdvice({ ...day, temperatureMin: 8 }).title).toContain('casaco');
    expect(weatherAdvice(day).title).toContain('planejado');
  });
});

import type { DayForecast, Preferences, Weather } from '../models/weather';

export type WeatherKind =
  | 'sun'
  | 'moon'
  | 'partly-cloudy'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'storm';

export function describeWeather(code: number, isDay = true): { label: string; kind: WeatherKind } {
  if (code === 0)
    return { label: isDay ? 'Céu limpo' : 'Noite limpa', kind: isDay ? 'sun' : 'moon' };
  if (code === 1 || code === 2) return { label: 'Parcialmente nublado', kind: 'partly-cloudy' };
  if (code === 3) return { label: 'Nublado', kind: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Nevoeiro', kind: 'fog' };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Garoa', kind: 'rain' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Chuva', kind: 'rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Neve', kind: 'snow' };
  if ([95, 96, 99].includes(code)) return { label: 'Trovoadas', kind: 'storm' };
  return { label: 'Condição indisponível', kind: 'cloud' };
}

export function temperatureValue(celsius: number, unit: Preferences['temperatureUnit']) {
  return Math.round(unit === 'fahrenheit' ? celsius * 1.8 + 32 : celsius);
}

export function formatTemperature(
  celsius: number,
  unit: Preferences['temperatureUnit'],
  suffix = false,
) {
  return `${temperatureValue(celsius, unit)}°${suffix ? (unit === 'fahrenheit' ? 'F' : 'C') : ''}`;
}

export function formatWind(kmh: number, unit: Preferences['windUnit']) {
  return unit === 'ms'
    ? `${(kmh / 3.6).toFixed(1).replace('.', ',')} m/s`
    : `${Math.round(kmh)} km/h`;
}

export function windDirection(degrees: number) {
  const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
  return directions[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

export function localDate(
  timestamp: number,
  timezone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat('pt-BR', { ...options, timeZone: timezone }).format(
    new Date(timestamp * 1000),
  );
}

export function hourLabel(timestamp: number, timezone: string) {
  return `${localDate(timestamp, timezone, { hour: '2-digit', hourCycle: 'h23' })}h`;
}

export function clockLabel(timestamp: number, timezone: string) {
  return localDate(timestamp, timezone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

export function dayLabel(timestamp: number, timezone: string, now = Date.now()) {
  const key = (seconds: number) =>
    localDate(seconds, timezone, { year: 'numeric', month: '2-digit', day: '2-digit' });
  if (key(timestamp) === key(now / 1000)) return 'Hoje';
  if (key(timestamp) === key(now / 1000 + 86400)) return 'Amanhã';
  const label = localDate(timestamp, timezone, { weekday: 'long' }).replace('-feira', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function uvLevel(index: number) {
  if (index < 3) return 'Baixo';
  if (index < 6) return 'Moderado';
  if (index < 8) return 'Alto';
  if (index < 11) return 'Muito alto';
  return 'Extremo';
}

export function weatherAdvice(day: DayForecast) {
  if (day.precipitationProbability >= 60)
    return {
      title: 'O guarda-chuva vai junto.',
      text: `A chance de chuva chega a ${Math.round(day.precipitationProbability)}%. Vale se preparar antes de sair.`,
    };
  if (day.uvIndex >= 6)
    return {
      title: 'Sol pede um cuidado a mais.',
      text: `Índice UV ${uvLevel(day.uvIndex).toLowerCase()}. Protetor solar e uma sombra fazem diferença.`,
    };
  if (day.temperatureMin <= 12)
    return {
      title: 'Um casaco na mochila.',
      text: 'A temperatura cai ao longo do dia. Leve uma camada extra se for voltar mais tarde.',
    };
  return {
    title: 'Seu dia, bem planejado.',
    text: 'Confira as próximas horas antes de sair. A previsão pode mudar ao longo do dia.',
  };
}

export function nextHours(weather: Weather) {
  const reference = Math.max(weather.current.time, Math.floor(Date.now() / 1000));
  return weather.hourly.filter((hour) => hour.time >= reference - 3599).slice(0, 24);
}

export function validateCityQuery(query: string) {
  const normalized = query.trim().replace(/\s+/g, ' ');
  if (normalized.length < 2)
    return { value: normalized, error: 'Digite pelo menos 2 letras para buscar uma cidade.' };
  if (normalized.length > 80)
    return { value: normalized, error: 'Use até 80 caracteres na busca.' };
  if (!/\p{L}/u.test(normalized))
    return { value: normalized, error: 'Digite o nome de uma cidade usando letras.' };
  return { value: normalized, error: null };
}

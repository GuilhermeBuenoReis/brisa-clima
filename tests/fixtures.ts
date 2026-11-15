export function forecastFixture(temperature = 23, now = Date.now()) {
  const seconds = Math.floor(now / 1000);
  const midnight = Math.floor((seconds - 10800) / 86400) * 86400 + 10800;
  const hours = Array.from({ length: 168 }, (_, i) => midnight + i * 3600);
  const days = Array.from({ length: 7 }, (_, i) => midnight + i * 86400);
  return {
    latitude: -25.4,
    longitude: -51.5,
    timezone: 'America/Sao_Paulo',
    current: {
      time: seconds,
      temperature_2m: temperature,
      relative_humidity_2m: 65,
      apparent_temperature: temperature - 1,
      is_day: 1,
      precipitation: 0,
      weather_code: 2,
      wind_speed_10m: 12,
      wind_direction_10m: 90,
      pressure_msl: 1015,
    },
    hourly: {
      time: hours,
      temperature_2m: hours.map((_, i) => temperature + (i % 5) - 2),
      weather_code: hours.map(() => 2),
      precipitation_probability: hours.map(() => 25),
      is_day: hours.map((_, i) => (i % 24 >= 6 && i % 24 < 19 ? 1 : 0)),
    },
    daily: {
      time: days,
      weather_code: [2, 61, 3, 0, 2, 61, 0],
      temperature_2m_max: [26, 24, 23, 27, 28, 22, 25],
      temperature_2m_min: [15, 16, 14, 13, 17, 15, 14],
      precipitation_probability_max: [25, 80, 30, 5, 15, 65, 10],
      precipitation_sum: [0, 12, 0.2, 0, 0, 7, 0],
      wind_speed_10m_max: [18, 22, 15, 11, 18, 26, 14],
      uv_index_max: [7, 4, 5, 8, 7, 3, 8],
      sunrise: days.map((day) => day + 5 * 3600 + 30 * 60),
      sunset: days.map((day) => day + 19 * 3600),
    },
  };
}

export const geocodingFixture = {
  results: [
    {
      id: 3464975,
      name: 'Curitiba',
      latitude: -25.4278,
      longitude: -49.2731,
      admin1: 'Paraná',
      country: 'Brasil',
      country_code: 'BR',
      timezone: 'America/Sao_Paulo',
    },
    {
      id: 1234,
      name: 'Curitiba',
      latitude: -26,
      longitude: -49,
      admin1: 'Santa Catarina',
      country: 'Brasil',
      country_code: 'BR',
      timezone: 'America/Sao_Paulo',
    },
  ],
};

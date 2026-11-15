import {
  ArrowDown,
  ArrowUp,
  Droplets,
  Heart,
  type LucideIcon,
  MapPin,
  MoveUpRight,
} from 'lucide-react-native';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { City, DayForecast, Preferences, Weather } from '../models/weather';
import { colors, common, fonts } from '../theme';
import {
  clockLabel,
  dayLabel,
  describeWeather,
  formatTemperature,
  hourLabel,
  localDate,
  nextHours,
} from '../utils/weather';
import { IconButton, Text } from './ui';
import { SkyLandscape, SunArc, WeatherIcon } from './weather-art';

export function CurrentWeatherCard({
  city,
  weather,
  unit,
  favorite,
  onFavorite,
}: {
  city: City;
  weather: Weather;
  unit: Preferences['temperatureUnit'];
  favorite: boolean;
  onFavorite: () => void;
}) {
  const today = weather.daily[0];
  const { current } = weather;
  return (
    <View style={styles.hero} testID="current-weather-card">
      <View style={styles.heroContent}>
        <View style={common.between}>
          <View style={styles.locationBadge}>
            <MapPin size={12} color={colors.blue} />
            <Text style={styles.locationLabel}>
              {city.id.startsWith('gps:') ? 'SUA LOCALIZAÇÃO' : 'TEMPO AGORA'}
            </Text>
          </View>
          <IconButton
            label={
              favorite ? `Remover ${city.name} dos favoritos` : `Salvar ${city.name} nos favoritos`
            }
            icon={Heart}
            active={favorite}
            onPress={onFavorite}
          />
        </View>
        <Text style={styles.cityName} accessibilityRole="header">
          {city.name}
        </Text>
        <Text style={styles.cityRegion}>
          {[city.region, city.country].filter(Boolean).join(', ') || 'Localização pelo GPS'}
        </Text>
        <View style={styles.heroWeather}>
          <View style={styles.tempBlock}>
            <Text style={styles.heroTemperature} testID="current-temperature">
              {formatTemperature(current.temperature, unit)}
            </Text>
            <Text style={styles.heroUnit}>{unit === 'celsius' ? 'CELSIUS' : 'FAHRENHEIT'}</Text>
          </View>
          <View style={styles.heroIcon}>
            <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={126} />
          </View>
        </View>
        <Text style={styles.condition}>
          {describeWeather(current.weatherCode, current.isDay).label}
        </Text>
        <View style={styles.heroBottom}>
          <Text style={styles.feelsLike}>
            Sensação de {formatTemperature(current.apparentTemperature, unit)}
          </Text>
          <View style={styles.minMax}>
            <ArrowUp size={12} color={colors.text} />
            <Text style={styles.minMaxText}>{formatTemperature(today.temperatureMax, unit)}</Text>
            <ArrowDown size={12} color={colors.muted} />
            <Text style={styles.minText}>{formatTemperature(today.temperatureMin, unit)}</Text>
          </View>
        </View>
      </View>
      <View style={styles.landscape}>
        <SkyLandscape isDay={current.isDay} />
      </View>
    </View>
  );
}

export function HourlyList({
  weather,
  unit,
}: {
  weather: Weather;
  unit: Preferences['temperatureUnit'];
}) {
  const hours = nextHours(weather);
  if (!hours.length)
    return <Text>A previsão por hora salva já terminou. Conecte-se para atualizar.</Text>;
  return (
    <FlatList
      horizontal
      data={hours}
      keyExtractor={(hour) => String(hour.time)}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hourList}
      accessibilityLabel="Previsão das próximas 24 horas"
      renderItem={({ item, index }) => (
        <View style={[styles.hourCard, index === 0 && styles.hourActive]}>
          <Text style={[styles.hourTime, index === 0 && styles.hourTimeActive]}>
            {index === 0 && Math.abs(item.time - weather.current.time) < 3600
              ? 'Agora'
              : hourLabel(item.time, weather.timezone)}
          </Text>
          <WeatherIcon code={item.weatherCode} isDay={item.isDay} size={38} />
          <Text style={styles.hourTemperature}>{formatTemperature(item.temperature, unit)}</Text>
          <View style={styles.hourRain}>
            <Droplets size={10} color={colors.blue} />
            <Text style={styles.hourRainText}>{Math.round(item.precipitationProbability)}%</Text>
          </View>
        </View>
      )}
    />
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent = colors.blue,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={common.between}>
        <Text variant="caption">{label}</Text>
        <Icon size={17} color={accent} strokeWidth={1.7} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text variant="caption" style={styles.metricDetail}>
        {detail}
      </Text>
    </View>
  );
}

export function SunCard({ weather }: { weather: Weather }) {
  const day = weather.daily[0];
  const reference = Date.now() / 1000;
  const progress = (reference - day.sunrise) / (day.sunset - day.sunrise);
  const daylightMinutes = Math.round((day.sunset - day.sunrise) / 60);
  return (
    <View style={styles.sunCard}>
      <View style={common.between}>
        <Text variant="heading">Do nascer ao pôr do sol</Text>
        <Text variant="caption">
          {Math.floor(daylightMinutes / 60)}h {daylightMinutes % 60}m de luz
        </Text>
      </View>
      <SunArc progress={progress} />
      <View style={common.between}>
        <View>
          <Text variant="caption">Nascer do sol</Text>
          <Text style={styles.sunTime}>{clockLabel(day.sunrise, weather.timezone)}</Text>
        </View>
        <View style={styles.sunset}>
          <Text variant="caption">Pôr do sol</Text>
          <Text style={styles.sunTime}>{clockLabel(day.sunset, weather.timezone)}</Text>
        </View>
      </View>
    </View>
  );
}

export function ForecastRow({
  day,
  weather,
  unit,
  selected,
  onPress,
}: {
  day: DayForecast;
  weather: Weather;
  unit: Preferences['temperatureUnit'];
  selected: boolean;
  onPress: () => void;
}) {
  const low = Math.min(...weather.daily.map((item) => item.temperatureMin));
  const high = Math.max(...weather.daily.map((item) => item.temperatureMax));
  const span = Math.max(high - low, 1);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalhes de ${dayLabel(day.time, weather.timezone)}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.forecastRow,
        selected && styles.forecastSelected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.forecastDate}>
        <Text style={[styles.forecastDay, selected && { color: colors.amber }]}>
          {dayLabel(day.time, weather.timezone)}
        </Text>
        <Text variant="caption">
          {localDate(day.time, weather.timezone, { day: '2-digit', month: '2-digit' })}
        </Text>
      </View>
      <View style={styles.forecastCondition}>
        <WeatherIcon code={day.weatherCode} size={34} />
        <Text style={styles.forecastRain}>{Math.round(day.precipitationProbability)}%</Text>
      </View>
      <View style={styles.range}>
        <Text style={styles.rangeMin}>{formatTemperature(day.temperatureMin, unit)}</Text>
        <View style={styles.rangeTrack}>
          <View
            style={[
              styles.rangeFill,
              {
                left: `${((day.temperatureMin - low) / span) * 80}%`,
                width: `${Math.max(((day.temperatureMax - day.temperatureMin) / span) * 80, 12)}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.rangeMax}>{formatTemperature(day.temperatureMax, unit)}</Text>
      </View>
    </Pressable>
  );
}

export function CityCard({
  city,
  weather,
  unit,
  active,
  onSelect,
  onFavorite,
  favorite,
}: {
  city: City;
  weather?: Weather;
  unit: Preferences['temperatureUnit'];
  active: boolean;
  favorite: boolean;
  onSelect: () => void;
  onFavorite: () => void;
}) {
  return (
    <View
      testID={`city-card-${city.id}`}
      style={[styles.cityCard, active && styles.cityCardActive]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver clima de ${city.name}`}
        onPress={onSelect}
        style={styles.citySelect}
      >
        <View style={styles.cityInfo}>
          <View style={styles.cityTitleRow}>
            <Text style={styles.cityTitle}>{city.name}</Text>
            {active && <View style={styles.activeDot} />}
          </View>
          <Text variant="caption">
            {[city.region, city.countryCode].filter(Boolean).join(' · ') || 'Localização pelo GPS'}
          </Text>
          {weather && (
            <Text variant="caption">
              {describeWeather(weather.current.weatherCode, weather.current.isDay).label}
            </Text>
          )}
        </View>
        {weather ? (
          <View style={styles.cityWeather}>
            <WeatherIcon
              code={weather.current.weatherCode}
              isDay={weather.current.isDay}
              size={40}
            />
            <Text style={styles.cityTemperature}>
              {formatTemperature(weather.current.temperature, unit)}
            </Text>
          </View>
        ) : (
          <MoveUpRight size={20} color={colors.subtle} />
        )}
      </Pressable>
      <View style={styles.citySave}>
        <IconButton
          label={
            favorite ? `Remover ${city.name} dos favoritos` : `Salvar ${city.name} nos favoritos`
          }
          icon={Heart}
          active={favorite}
          onPress={onFavorite}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#293A44',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#40535E',
    overflow: 'hidden',
    minHeight: 345,
  },
  heroContent: { padding: 22, zIndex: 1 },
  locationBadge: { ...common.row, gap: 6 },
  locationLabel: { color: '#C0D6E1', fontFamily: fonts.semibold, fontSize: 9, letterSpacing: 1.5 },
  cityName: {
    fontSize: 29,
    lineHeight: 37,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -1,
    marginTop: 4,
  },
  cityRegion: { color: '#ADC1CC', fontSize: 12 },
  heroWeather: { ...common.row, justifyContent: 'space-between', marginTop: 10, minHeight: 130 },
  tempBlock: { gap: 0 },
  heroTemperature: {
    fontSize: 82,
    lineHeight: 96,
    fontFamily: fonts.regular,
    color: colors.text,
    letterSpacing: -6,
  },
  heroUnit: { color: '#9EB5C0', fontSize: 8, letterSpacing: 2.4, marginTop: -4, marginLeft: 5 },
  heroIcon: { marginRight: -9, opacity: 0.98 },
  condition: { fontSize: 15, fontFamily: fonts.medium, color: '#EFF1EB', marginTop: 10 },
  heroBottom: { ...common.between, marginTop: 4, flexWrap: 'wrap', gap: 5, marginBottom: 5 },
  feelsLike: { color: '#C5D2D5', fontSize: 11 },
  minMax: { ...common.row, gap: 4 },
  minMaxText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
  minText: { fontSize: 12, color: '#C1CED2' },
  landscape: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  hourList: { gap: 8, paddingBottom: 1 },
  hourCard: {
    width: 65,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourActive: { backgroundColor: colors.amberSoft, borderColor: '#79603A' },
  hourTime: { fontSize: 10, color: colors.muted, fontFamily: fonts.medium },
  hourTimeActive: { color: colors.amber },
  hourTemperature: { fontSize: 18, fontFamily: fonts.semibold, color: colors.text },
  hourRain: { ...common.row, gap: 3 },
  hourRainText: { fontSize: 9, color: colors.blue },
  metric: { ...common.card, width: '48.5%', padding: 16, gap: 8, minHeight: 119 },
  metricValue: {
    fontSize: 25,
    lineHeight: 32,
    fontFamily: fonts.medium,
    color: colors.text,
    letterSpacing: -0.8,
  },
  metricDetail: { fontSize: 10, marginTop: -5 },
  sunCard: { ...common.card, padding: 18 },
  sunTime: { color: colors.text, fontSize: 18, fontFamily: fonts.medium, marginTop: 2 },
  sunset: { alignItems: 'flex-end' },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    minHeight: 79,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 14,
  },
  forecastSelected: { backgroundColor: colors.elevated, borderColor: '#4E493C' },
  forecastDate: { flex: 1, minWidth: 64 },
  forecastDay: { color: colors.text, fontSize: 12, fontFamily: fonts.medium },
  forecastCondition: { alignItems: 'center', width: 36 },
  forecastRain: { fontSize: 9, lineHeight: 13, color: colors.blue },
  range: { ...common.row, gap: 8, flex: 1.35 },
  rangeMin: { color: colors.muted, fontSize: 12, width: 29, textAlign: 'right' },
  rangeMax: { color: colors.text, fontSize: 12, width: 29, fontFamily: fonts.medium },
  rangeTrack: {
    height: 4,
    flex: 1,
    minWidth: 30,
    borderRadius: 4,
    backgroundColor: '#35414A',
    position: 'relative',
  },
  rangeFill: { position: 'absolute', height: 4, borderRadius: 4, backgroundColor: colors.amber },
  cityCard: {
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    minHeight: 108,
  },
  cityCardActive: { borderColor: '#706044', backgroundColor: '#252820' },
  citySelect: { flex: 1, padding: 16, minHeight: 104, ...common.between, gap: 8 },
  cityInfo: { flex: 1, gap: 2 },
  cityTitleRow: { ...common.row, gap: 8 },
  cityTitle: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.medium,
    flexShrink: 1,
    letterSpacing: -0.4,
  },
  activeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.amber },
  cityWeather: { alignItems: 'center' },
  cityTemperature: { fontSize: 20, color: colors.text, fontFamily: fonts.medium },
  citySave: { paddingLeft: 0 },
});

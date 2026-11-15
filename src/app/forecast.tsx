import { CalendarDays, CloudRain, Sunrise, Sunset, Wind } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  ErrorState,
  LoadingState,
  Notice,
  PageHeader,
  Screen,
  SectionHeader,
  Text,
} from '../components/ui';
import { WeatherIcon } from '../components/weather-art';
import { ForecastRow, MetricCard } from '../components/weather-cards';
import { useWeather } from '../context/weather-context';
import { colors, common, fonts } from '../theme';
import {
  clockLabel,
  dayLabel,
  describeWeather,
  formatTemperature,
  formatWind,
  localDate,
} from '../utils/weather';

export default function ForecastScreen() {
  const { state, cache, error, refresh } = useWeather();
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const weather = cache[state.selectedCity.id];
  const day = weather?.daily.find((item) => item.time === selectedTime) ?? weather?.daily[0];
  return (
    <Screen scroll={false}>
      <PageHeader
        eyebrow="OLHE ADIANTE"
        title="Os próximos dias."
        subtitle={`${state.selectedCity.name} · Previsão de 7 dias`}
        action={<CalendarDays size={20} color={colors.amber} />}
      />
      {!weather ? (
        error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
          <LoadingState />
        )
      ) : (
        <FlatList
          data={weather.daily}
          keyExtractor={(item) => String(item.time)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          extraData={[selectedTime, state.preferences]}
          ListHeaderComponent={
            <>
              {error && (
                <Notice
                  cached
                  message="Sem atualização no momento. Você está vendo a previsão salva."
                />
              )}
              <View style={styles.summary}>
                <View style={styles.summaryIcon}>
                  <WeatherIcon code={weather.daily[0].weatherCode} size={54} />
                </View>
                <View style={styles.summaryText}>
                  <Text variant="label">
                    HOJE, EM {state.selectedCity.name.toLocaleUpperCase('pt-BR')}
                  </Text>
                  <Text style={styles.summaryTitle}>
                    {describeWeather(weather.daily[0].weatherCode).label}
                  </Text>
                  <Text style={styles.summaryRange}>
                    De{' '}
                    {formatTemperature(
                      weather.daily[0].temperatureMin,
                      state.preferences.temperatureUnit,
                    )}{' '}
                    a{' '}
                    {formatTemperature(
                      weather.daily[0].temperatureMax,
                      state.preferences.temperatureUnit,
                    )}
                  </Text>
                </View>
              </View>
              <SectionHeader title="Sua semana" action="Toque em um dia" />
            </>
          }
          renderItem={({ item }) => (
            <ForecastRow
              day={item}
              weather={weather}
              unit={state.preferences.temperatureUnit}
              selected={item.time === day?.time}
              onPress={() => setSelectedTime(item.time)}
            />
          )}
          ListFooterComponent={
            day && (
              <View style={styles.details} testID="forecast-details">
                <SectionHeader title={`${dayLabel(day.time, weather.timezone)}, em detalhes`} />
                <View style={styles.detailHeader}>
                  <WeatherIcon code={day.weatherCode} size={42} />
                  <View style={styles.detailHeaderText}>
                    <Text variant="heading">{describeWeather(day.weatherCode).label}</Text>
                    <Text>
                      {localDate(day.time, weather.timezone, { day: 'numeric', month: 'long' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.metrics}>
                  <MetricCard
                    label="Chuva"
                    icon={CloudRain}
                    value={`${Math.round(day.precipitationProbability)}%`}
                    detail={`${day.precipitationSum.toFixed(1).replace('.', ',')} mm previstos`}
                  />
                  <MetricCard
                    label="Vento máximo"
                    icon={Wind}
                    value={formatWind(day.windSpeed, state.preferences.windUnit)}
                    detail="Velocidade a 10 m do solo"
                  />
                </View>
                <View style={styles.sunTimes}>
                  <View style={styles.sunTime}>
                    <Sunrise color={colors.amber} size={18} />
                    <Text variant="caption">Nascer</Text>
                    <Text style={styles.timeValue}>
                      {clockLabel(day.sunrise, weather.timezone)}
                    </Text>
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.sunTime}>
                    <Sunset color={colors.amber} size={18} />
                    <Text variant="caption">Pôr do sol</Text>
                    <Text style={styles.timeValue}>{clockLabel(day.sunset, weather.timezone)}</Text>
                  </View>
                </View>
                <Text variant="caption" style={styles.source}>
                  Horários locais de {state.selectedCity.name}. Dados: Open-Meteo.
                </Text>
              </View>
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 28 },
  summary: {
    ...common.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    gap: 13,
    marginBottom: 20,
    marginTop: 2,
  },
  summaryIcon: { width: 61, height: 68, alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1, gap: 3 },
  summaryTitle: { fontSize: 17, fontFamily: fonts.medium, color: colors.text, letterSpacing: -0.5 },
  summaryRange: { fontSize: 12 },
  details: { marginTop: 16, gap: 13 },
  detailHeader: { ...common.row, gap: 10, marginTop: -6, marginBottom: 4 },
  detailHeaderText: { flex: 1 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  sunTimes: { ...common.card, flexDirection: 'row', padding: 16, alignItems: 'center' },
  sunTime: { flex: 1, alignItems: 'center', gap: 5 },
  timeValue: { color: colors.text, fontSize: 20, fontFamily: fonts.medium },
  timeDivider: { height: 49, width: 1, backgroundColor: colors.border },
  source: { textAlign: 'center', marginTop: 4 },
});

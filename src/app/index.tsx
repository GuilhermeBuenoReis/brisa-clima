import { useRouter } from 'expo-router';
import {
  ArrowDownToLine,
  CloudRain,
  Droplets,
  MapPin,
  RefreshCw,
  Sun,
  Wind,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  ErrorState,
  IconButton,
  LoadingState,
  Notice,
  Screen,
  SectionHeader,
  Text,
} from '../components/ui';
import { BrandMark } from '../components/weather-art';
import { CurrentWeatherCard, HourlyList, MetricCard, SunCard } from '../components/weather-cards';
import { useWeather } from '../context/weather-context';
import { colors, common, fonts } from '../theme';
import {
  clockLabel,
  formatWind,
  localDate,
  uvLevel,
  weatherAdvice,
  windDirection,
} from '../utils/weather';

export default function TodayScreen() {
  const router = useRouter();
  const { state, cache, hydrated, loading, error, notice, refresh, toggleFavorite, dismissNotice } =
    useWeather();
  const weather = cache[state.selectedCity.id];
  const favorite = state.favorites.some((city) => city.id === state.selectedCity.id);
  const today = weather?.daily[0];
  const advice = today ? weatherAdvice(today) : null;
  const date = localDate(Date.now() / 1000, weather?.timezone ?? state.selectedCity.timezone, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return (
    <Screen>
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <BrandMark size={30} />
          <Text style={styles.brandName}>brisa.</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Escolher cidade"
            onPress={() => router.navigate('/cities')}
            style={styles.cityButton}
          >
            <MapPin size={13} color={colors.muted} />
            <Text style={styles.cityLabel} numberOfLines={1}>
              {state.selectedCity.name}
            </Text>
          </Pressable>
          <IconButton
            label="Atualizar previsão"
            icon={RefreshCw}
            loading={loading}
            onPress={() => void refresh()}
          />
        </View>
      </View>
      <View style={styles.intro}>
        <Text variant="label">{date.toLocaleUpperCase('pt-BR')}</Text>
        <Text style={styles.introTitle} accessibilityRole="header">
          O céu por aqui.
        </Text>
      </View>
      {notice && <Notice message={notice} onDismiss={dismissNotice} />}
      {error && weather && (
        <Notice cached message={`${error} Mostrando a última consulta salva.`} />
      )}
      {!error && weather && Date.now() - weather.fetchedAt > 1800000 && (
        <Notice
          cached
          message="Esta previsão foi salva há mais de 30 minutos. Atualize para consultar os dados mais recentes."
        />
      )}
      {!weather ? (
        error ? (
          <ErrorState message={error} onRetry={() => void refresh()} />
        ) : (
          <LoadingState />
        )
      ) : (
        <>
          <CurrentWeatherCard
            city={state.selectedCity}
            weather={weather}
            unit={state.preferences.temperatureUnit}
            favorite={favorite}
            onFavorite={() => toggleFavorite(state.selectedCity)}
          />
          <View>
            <SectionHeader
              title="Nas próximas horas"
              action="7 dias"
              onPress={() => router.navigate('/forecast')}
            />
            <HourlyList weather={weather} unit={state.preferences.temperatureUnit} />
          </View>
          <View>
            <SectionHeader title="Um olhar nos detalhes" />
            <View style={styles.metrics}>
              <MetricCard
                label="Chance de chuva"
                value={`${Math.round(today?.precipitationProbability ?? 0)}%`}
                detail="Maior chance de hoje"
                icon={CloudRain}
              />
              <MetricCard
                label="Vento"
                value={formatWind(weather.current.windSpeed, state.preferences.windUnit)}
                detail={`Direção ${windDirection(weather.current.windDirection)}`}
                icon={Wind}
              />
              <MetricCard
                label="Umidade"
                value={`${Math.round(weather.current.humidity)}%`}
                detail="Umidade relativa do ar"
                icon={Droplets}
              />
              <MetricCard
                label="Índice UV"
                value={`${today?.uvIndex.toFixed(1).replace('.', ',') ?? '—'}`}
                detail={uvLevel(today?.uvIndex ?? 0)}
                icon={Sun}
                accent={colors.amber}
              />
            </View>
          </View>
          {advice && (
            <View style={styles.advice}>
              <View style={styles.adviceIcon}>
                <ArrowDownToLine size={19} color={colors.amber} />
              </View>
              <View style={styles.adviceContent}>
                <Text style={styles.adviceTitle}>{advice.title}</Text>
                <Text style={styles.adviceText}>{advice.text}</Text>
              </View>
            </View>
          )}
          <SunCard weather={weather} />
          <View style={styles.footer}>
            <View style={styles.statusDot} />
            <Text variant="caption">
              Consultado às {clockLabel(weather.fetchedAt / 1000, weather.timezone)} · Open-Meteo
            </Text>
          </View>
        </>
      )}
      {!hydrated && (
        <Text variant="caption" style={styles.initializing}>
          Lendo suas preferências…
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { ...common.between, gap: 10 },
  brand: { ...common.row, gap: 7 },
  brandName: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -1.2,
  },
  topActions: { ...common.row, gap: 10, flexShrink: 1 },
  cityButton: { ...common.row, gap: 5, minHeight: 44, maxWidth: 140 },
  cityLabel: { fontSize: 11, flexShrink: 1 },
  intro: { gap: 6, marginTop: 6 },
  introTitle: {
    fontSize: 29,
    lineHeight: 38,
    fontFamily: fonts.semibold,
    letterSpacing: -1.1,
    color: colors.text,
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  advice: { ...common.row, gap: 13, paddingVertical: 2 },
  adviceIcon: {
    width: 42,
    height: 42,
    backgroundColor: colors.amberSoft,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceContent: { flex: 1, gap: 3 },
  adviceTitle: { color: colors.text, fontSize: 13, fontFamily: fonts.medium },
  adviceText: { fontSize: 11, lineHeight: 18 },
  footer: { ...common.row, justifyContent: 'center', gap: 6, marginTop: 0 },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.green },
  initializing: { textAlign: 'center' },
});

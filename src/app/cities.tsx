import { useRouter } from 'expo-router';
import { Heart, LocateFixed, MapPin, Search, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Pressable, StyleSheet, TextInput, View } from 'react-native';
import {
  Button,
  EmptyState,
  Notice,
  PageHeader,
  Screen,
  SectionHeader,
  Text,
} from '../components/ui';
import { CityCard } from '../components/weather-cards';
import { useWeather } from '../context/weather-context';
import { type City, SUGGESTED_CITIES } from '../models/weather';
import { searchCities } from '../services/api';
import { colors, common, fonts } from '../theme';
import { validateCityQuery } from '../utils/weather';

export default function CitiesScreen() {
  const router = useRouter();
  const {
    state,
    cache,
    hydrated,
    selectCity,
    toggleFavorite,
    locate,
    locating,
    notice,
    dismissNotice,
  } = useWeather();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  function changeQuery(value: string) {
    controller.current?.abort();
    controller.current = null;
    setQuery(value);
    setInputError(null);
    setSearched(false);
    setResults([]);
    setSearching(false);
  }

  async function submit() {
    const validated = validateCityQuery(query);
    controller.current?.abort();
    if (validated.error) {
      setInputError(validated.error);
      return;
    }
    Keyboard.dismiss();
    const pending = new AbortController();
    controller.current = pending;
    setSearching(true);
    setInputError(null);
    setSearched(false);
    try {
      const cities = await searchCities(validated.value, pending.signal);
      if (pending.signal.aborted) return;
      setResults(cities);
      setSearched(true);
    } catch (cause) {
      if (!pending.signal.aborted)
        setInputError(
          cause instanceof Error ? cause.message : 'Não foi possível buscar esta cidade.',
        );
    } finally {
      if (!pending.signal.aborted) setSearching(false);
    }
  }

  function openCity(city: City) {
    selectCity(city);
    router.navigate('/');
  }

  const list = searched ? results : state.favorites;
  const showSuggestions = !searched && !searching && query.trim().length === 0;

  return (
    <Screen scroll={false}>
      <PageHeader
        eyebrow="PERTO OU LONGE"
        title="Seus lugares."
        subtitle="Encontre uma cidade. Leve o tempo com você."
        action={<MapPin size={20} color={colors.amber} />}
      />
      <FlatList
        testID="cities-list"
        data={list}
        keyExtractor={(city) => city.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Buscar cidade</Text>
              <View style={[styles.inputWrap, inputError && styles.inputError]}>
                <Search color={colors.subtle} size={18} />
                <TextInput
                  accessibilityLabel="Nome da cidade"
                  placeholder="Ex.: Curitiba"
                  placeholderTextColor={colors.subtle}
                  value={query}
                  onChangeText={changeQuery}
                  onSubmitEditing={() => void submit()}
                  returnKeyType="search"
                  autoCorrect={false}
                  autoCapitalize="words"
                  maxLength={81}
                  style={styles.input}
                  testID="city-search-input"
                />
                {query.length > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Limpar busca"
                    onPress={() => changeQuery('')}
                    style={styles.clearButton}
                  >
                    <X size={17} color={colors.muted} />
                  </Pressable>
                )}
              </View>
              {inputError && (
                <Text accessibilityRole="alert" style={styles.errorText}>
                  {inputError}
                </Text>
              )}
              <Button
                label={searching ? 'Buscando cidades…' : 'Buscar cidade'}
                icon={Search}
                loading={searching}
                disabled={!hydrated}
                onPress={() => void submit()}
                testID="city-search-button"
              />
            </View>
            <Button
              secondary
              label={locating ? 'Encontrando você…' : 'Usar minha localização'}
              icon={LocateFixed}
              loading={locating}
              disabled={!hydrated}
              onPress={() => {
                void locate().then((success) => {
                  if (success) router.navigate('/');
                });
              }}
            />
            <Text variant="caption" style={styles.locationHelp}>
              O GPS só é acessado quando você permite.
            </Text>
            {notice && <Notice message={notice} onDismiss={dismissNotice} />}
            <SectionHeader
              title={searched ? 'Resultado da busca' : 'Cidades salvas'}
              action={searched ? `${results.length} encontradas` : `${state.favorites.length}/12`}
            />
          </View>
        }
        renderItem={({ item }) => (
          <CityCard
            city={item}
            weather={cache[item.id]}
            unit={state.preferences.temperatureUnit}
            active={item.id === state.selectedCity.id}
            favorite={state.favorites.some((city) => city.id === item.id)}
            onSelect={() => openCity(item)}
            onFavorite={() => toggleFavorite(item)}
          />
        )}
        ListEmptyComponent={
          !searching ? (
            <EmptyState
              title={searched ? 'Nenhuma cidade por aqui.' : 'Seu próximo lugar está lá fora.'}
              description={
                searched
                  ? 'Confira a escrita ou tente uma cidade próxima. A busca também aceita cidades de outros países.'
                  : 'Busque uma cidade e toque no coração para guardá-la aqui.'
              }
              icon={searched ? Search : Heart}
            />
          ) : undefined
        }
        ListFooterComponent={
          <View style={styles.listFooter}>
            {showSuggestions && (
              <>
                <SectionHeader title="Que tal explorar?" />
                {SUGGESTED_CITIES.filter(
                  (city) => !state.favorites.some((favorite) => favorite.id === city.id),
                ).map((city) => (
                  <CityCard
                    key={city.id}
                    city={city}
                    weather={cache[city.id]}
                    unit={state.preferences.temperatureUnit}
                    active={city.id === state.selectedCity.id}
                    favorite={false}
                    onSelect={() => openCity(city)}
                    onFavorite={() => toggleFavorite(city)}
                  />
                ))}
              </>
            )}
            <View style={styles.tip}>
              <Heart size={14} color={colors.amber} />
              <Text variant="caption" style={styles.tipText}>
                Toque no coração para salvar. Toque na cidade para ver o clima.
              </Text>
            </View>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 28 },
  listHeader: { gap: 13 },
  form: { gap: 11 },
  fieldLabel: { color: colors.text, fontSize: 12, fontFamily: fonts.medium },
  inputWrap: {
    ...common.row,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingLeft: 14,
    minHeight: 52,
  },
  inputError: { borderColor: colors.danger },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    padding: 14,
    minHeight: 52,
  },
  clearButton: { width: 43, height: 48, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 19 },
  locationHelp: { textAlign: 'center', marginTop: -5, marginBottom: 4 },
  separator: { height: 10 },
  listFooter: { gap: 10, paddingTop: 18 },
  tip: { ...common.row, gap: 9, marginTop: 10, alignItems: 'flex-start', paddingHorizontal: 6 },
  tipText: { flex: 1 },
});

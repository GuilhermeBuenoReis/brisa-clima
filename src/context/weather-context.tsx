import * as Location from 'expo-location';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  type City,
  DEFAULT_PREFERENCES,
  DEFAULT_STATE,
  type Preferences,
  type SavedState,
  type WeatherCache,
} from '../models/weather';
import { fetchWeather } from '../services/api';
import {
  readSavedState,
  readWeatherCache,
  writeSavedState,
  writeWeatherCache,
} from '../services/storage';

type WeatherContextValue = {
  state: SavedState;
  cache: WeatherCache;
  hydrated: boolean;
  loading: boolean;
  locating: boolean;
  error: string | null;
  notice: string | null;
  selectCity: (city: City) => void;
  toggleFavorite: (city: City) => void;
  updatePreferences: (preferences: Partial<Preferences>) => void;
  restorePreferences: () => void;
  refresh: () => Promise<void>;
  locate: () => Promise<boolean>;
  dismissNotice: () => void;
};

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SavedState>(DEFAULT_STATE);
  const [cache, setCache] = useState<WeatherCache>({});
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const writeQueue = useRef(Promise.resolve());
  const locationPending = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([readSavedState(), readWeatherCache()])
      .then(([savedState, weatherCache]) => {
        if (!active) return;
        setState(savedState);
        setCache(weatherCache);
      })
      .catch(() => {
        if (active)
          setNotice('Não foi possível ler os dados salvos. Você pode continuar usando o app.');
      })
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
      activeRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeQueue.current = writeQueue.current
      .then(() => writeSavedState(state))
      .catch(() => {
        setNotice('Não foi possível salvar suas preferências neste dispositivo.');
      });
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeQueue.current = writeQueue.current
      .then(() => writeWeatherCache(cache))
      .catch(() => {
        setNotice('A previsão foi carregada, mas não pôde ser salva para uso sem conexão.');
      });
  }, [cache, hydrated]);

  const refresh = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const weather = await fetchWeather(state.selectedCity, controller.signal);
      if (id !== requestId.current || controller.signal.aborted) return;
      setCache((previous) => ({ ...previous, [weather.cityId]: weather }));
    } catch (cause) {
      if (id !== requestId.current || controller.signal.aborted) return;
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar a previsão. Tente novamente.',
      );
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [state.selectedCity]);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
    return () => activeRequest.current?.abort();
  }, [hydrated, refresh]);

  function selectCity(city: City) {
    activeRequest.current?.abort();
    requestId.current += 1;
    setError(null);
    setState((previous) => ({ ...previous, selectedCity: city }));
  }

  function toggleFavorite(city: City) {
    const exists = state.favorites.some((favorite) => favorite.id === city.id);
    if (!exists && state.favorites.length >= 12) {
      setNotice('Você pode salvar até 12 cidades. Remova uma para adicionar outra.');
      return;
    }
    setState((previous) => ({
      ...previous,
      favorites: previous.favorites.some((favorite) => favorite.id === city.id)
        ? previous.favorites.filter((favorite) => favorite.id !== city.id)
        : [...previous.favorites, city].slice(0, 12),
    }));
  }

  function updatePreferences(preferences: Partial<Preferences>) {
    setState((previous) => ({
      ...previous,
      preferences: { ...previous.preferences, ...preferences },
    }));
  }

  async function locate() {
    if (locationPending.current) return false;
    locationPending.current = true;
    setLocating(true);
    setNotice(null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setNotice('Localização não autorizada. Você pode buscar uma cidade pelo nome.');
        return false;
      }
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<Location.LocationObject>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  'O GPS demorou para responder. Tente novamente em uma área aberta ou busque sua cidade.',
                ),
              ),
            18000,
          );
        }),
      ]);
      const latitude = Math.round(position.coords.latitude * 1000) / 1000;
      const longitude = Math.round(position.coords.longitude * 1000) / 1000;
      let name = 'Minha localização';
      let region = '';
      let country = '';
      let countryCode = '';
      if (Platform.OS !== 'web') {
        try {
          const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
          const address = addresses[0];
          name = address?.city ?? address?.subregion ?? name;
          region = address?.region ?? '';
          country = address?.country ?? '';
          countryCode = address?.isoCountryCode ?? '';
        } catch {
          name = 'Minha localização';
        }
      }
      selectCity({
        id: `gps:${latitude}:${longitude}`,
        name,
        region,
        country,
        countryCode,
        latitude,
        longitude,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      return true;
    } catch (cause) {
      setNotice(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível acessar o GPS. Busque sua cidade pelo nome.',
      );
      return false;
    } finally {
      clearTimeout(timer);
      locationPending.current = false;
      setLocating(false);
    }
  }

  return (
    <WeatherContext.Provider
      value={{
        state,
        cache,
        hydrated,
        loading,
        locating,
        error,
        notice,
        selectCity,
        toggleFavorite,
        updatePreferences,
        restorePreferences: () => updatePreferences(DEFAULT_PREFERENCES),
        refresh,
        locate,
        dismissNotice: () => setNotice(null),
      }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (!context) throw new Error('useWeather precisa estar dentro de WeatherProvider.');
  return context;
}

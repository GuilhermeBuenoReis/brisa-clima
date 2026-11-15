import {
  BookOpen,
  Check,
  ExternalLink,
  Globe2,
  Heart,
  RotateCcw,
  ShieldCheck,
  Thermometer,
  Wind,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Notice, PageHeader, Screen, SectionHeader, Text } from '../components/ui';
import { BrandMark } from '../components/weather-art';
import { useWeather } from '../context/weather-context';
import { colors, common, fonts } from '../theme';
import { clockLabel } from '../utils/weather';

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
      {selected && <Check size={14} color={colors.amber} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { state, cache, updatePreferences, restorePreferences, hydrated, notice, dismissNotice } =
    useWeather();
  const [showAbout, setShowAbout] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const weather = cache[state.selectedCity.id];

  async function openSource() {
    try {
      await Linking.openURL('https://open-meteo.com/');
      setLinkError(null);
    } catch {
      setLinkError(
        'Não foi possível abrir o navegador. Acesse open-meteo.com para consultar a fonte dos dados.',
      );
    }
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="DO SEU JEITO"
        title="Pequenos ajustes."
        subtitle="Escolha como prefere acompanhar o tempo."
      />
      {notice && <Notice message={notice} onDismiss={dismissNotice} />}
      <View>
        <SectionHeader title="Unidades de medida" />
        <View style={styles.unitsCard}>
          <View style={styles.unitSection}>
            <View style={styles.settingLabel}>
              <Thermometer size={18} color={colors.blue} />
              <Text style={styles.settingTitle}>Temperatura</Text>
            </View>
            <View
              style={styles.choices}
              accessibilityRole="radiogroup"
              accessibilityLabel="Unidade de temperatura"
            >
              <Choice
                label="Celsius · °C"
                selected={state.preferences.temperatureUnit === 'celsius'}
                onPress={() => updatePreferences({ temperatureUnit: 'celsius' })}
              />
              <Choice
                label="Fahrenheit · °F"
                selected={state.preferences.temperatureUnit === 'fahrenheit'}
                onPress={() => updatePreferences({ temperatureUnit: 'fahrenheit' })}
              />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.unitSection}>
            <View style={styles.settingLabel}>
              <Wind size={18} color={colors.blue} />
              <Text style={styles.settingTitle}>Velocidade do vento</Text>
            </View>
            <View
              style={styles.choices}
              accessibilityRole="radiogroup"
              accessibilityLabel="Unidade de vento"
            >
              <Choice
                label="km/h"
                selected={state.preferences.windUnit === 'kmh'}
                onPress={() => updatePreferences({ windUnit: 'kmh' })}
              />
              <Choice
                label="m/s"
                selected={state.preferences.windUnit === 'ms'}
                onPress={() => updatePreferences({ windUnit: 'ms' })}
              />
            </View>
          </View>
        </View>
        <Text variant="caption" style={styles.savedNote}>
          {hydrated ? 'Suas escolhas são salvas automaticamente.' : 'Carregando suas escolhas…'}
        </Text>
      </View>
      <View>
        <SectionHeader title="Simples, como deve ser" />
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <ShieldCheck color={colors.green} size={21} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Sua localização é uma escolha</Text>
              <Text style={styles.infoBody}>
                O GPS só funciona com sua permissão, durante a consulta. Sem rastreamento em segundo
                plano.
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Heart color={colors.amber} size={21} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Seus lugares ficam com você</Text>
              <Text style={styles.infoBody}>
                Cidades, preferências e as últimas previsões ficam salvas neste dispositivo, mesmo
                ao fechar o app.
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View>
        <SectionHeader title="Por trás da previsão" />
        <View style={styles.sourceCard}>
          <View style={common.between}>
            <View style={styles.settingLabel}>
              <Globe2 color={colors.blue} size={20} />
              <Text style={styles.infoTitle}>Open-Meteo</Text>
            </View>
            <Text variant="caption">API pública</Text>
          </View>
          <Text style={styles.infoBody}>
            Previsões de modelos meteorológicos. Os valores são estimativas e podem mudar. As
            consultas usam as coordenadas da cidade ou do GPS autorizado.
          </Text>
          {weather && (
            <Text variant="caption">
              Última consulta: {clockLabel(weather.fetchedAt / 1000, weather.timezone)} ·{' '}
              {Object.keys(cache).length}{' '}
              {Object.keys(cache).length === 1 ? 'previsão salva' : 'previsões salvas'}
            </Text>
          )}
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Conhecer a Open-Meteo"
            onPress={() => void openSource()}
            style={styles.sourceLink}
          >
            <Text style={styles.sourceLinkText}>Conhecer a fonte dos dados</Text>
            <ExternalLink size={14} color={colors.amber} />
          </Pressable>
        </View>
        {linkError && (
          <Text accessibilityRole="alert" style={styles.error}>
            {linkError}
          </Text>
        )}
      </View>
      <Button label="Sobre o Brisa" secondary icon={BookOpen} onPress={() => setShowAbout(true)} />
      <Button
        label="Restaurar unidades padrão"
        secondary
        icon={RotateCcw}
        disabled={!hydrated}
        onPress={restorePreferences}
      />
      <View style={styles.brandFooter}>
        <BrandMark size={30} />
        <Text style={styles.footerTitle}>brisa.</Text>
        <Text variant="caption">Um olhar leve para o seu dia. · v1.0.0</Text>
      </View>
      <Modal
        visible={showAbout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard} accessibilityViewIsModal>
            <BrandMark size={44} />
            <Text variant="title">Feito para o dia a dia.</Text>
            <Text>
              Brisa é um app de clima com previsão atual, próximos dias, busca de cidades e
              preferências salvas.
            </Text>
            <Text style={styles.aboutAuthor}>Guilherme Bueno Reis</Text>
            <Text variant="caption">
              Engenharia de Software · Uniguairacá{`\n`}Projeto acadêmico · React Native com Expo
            </Text>
            <Text variant="caption">
              Dados meteorológicos: Open-Meteo.{`\n`}Geocodificação: GeoNames via Open-Meteo.{`\n`}
              Dados sob licença CC BY 4.0.
            </Text>
            <Button label="Voltar aos ajustes" onPress={() => setShowAbout(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  unitsCard: { ...common.card, padding: 17, gap: 18 },
  unitSection: { gap: 14 },
  settingLabel: { ...common.row, gap: 9 },
  settingTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  choices: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    minHeight: 47,
    paddingHorizontal: 8,
  },
  choiceSelected: { borderColor: '#79603A', backgroundColor: colors.amberSoft },
  choiceText: { fontSize: 11, fontFamily: fonts.medium },
  choiceTextSelected: { color: colors.amber },
  divider: { height: 1, backgroundColor: colors.border },
  savedNote: { marginTop: 10, textAlign: 'center' },
  infoCard: { ...common.card, padding: 18, gap: 18 },
  infoRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, gap: 6 },
  infoTitle: { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  infoBody: { fontSize: 12, lineHeight: 20 },
  sourceCard: { ...common.card, padding: 18, gap: 13 },
  sourceLink: { ...common.row, gap: 7, minHeight: 44 },
  sourceLinkText: { fontSize: 12, color: colors.amber },
  error: { color: colors.danger, marginTop: 10 },
  brandFooter: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  footerTitle: { fontFamily: fonts.semibold, color: colors.text, fontSize: 23, letterSpacing: -1 },
  modalBackdrop: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'center', padding: 24 },
  modalCard: {
    ...common.card,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    padding: 24,
    gap: 17,
  },
  aboutAuthor: { fontFamily: fonts.medium, color: colors.text, fontSize: 14, marginBottom: -12 },
});

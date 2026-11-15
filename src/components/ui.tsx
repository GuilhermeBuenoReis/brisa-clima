import {
  ArrowUpRight,
  CircleAlert,
  CloudOff,
  type LucideIcon,
  RefreshCw,
  X,
} from 'lucide-react-native';
import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Text as NativeText,
  Pressable,
  ScrollView,
  StyleSheet,
  type TextProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, common, fonts } from '../theme';

type TypographyProps = TextProps & { variant?: 'title' | 'heading' | 'body' | 'caption' | 'label' };

export function Text({ variant = 'body', style, ...props }: TypographyProps) {
  return <NativeText {...props} style={[styles.text, typography[variant], style]} />;
}

export function Button({
  label,
  onPress,
  icon: Icon,
  secondary = false,
  loading = false,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  secondary?: boolean;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={secondary ? colors.text : colors.background} />
      ) : (
        Icon && (
          <Icon size={18} color={secondary ? colors.text : colors.background} strokeWidth={1.8} />
        )
      )}
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  label,
  icon: Icon,
  onPress,
  active = false,
  loading = false,
  testID,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  active?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, disabled: loading }}
      disabled={loading}
      testID={testID}
      onPress={onPress}
      hitSlop={3}
      style={({ pressed }) => [
        styles.iconButton,
        active && styles.activeIconButton,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.amber} />
      ) : (
        <Icon size={20} strokeWidth={1.8} color={active ? colors.amber : colors.text} />
      )}
    </Pressable>
  );
}

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.screenContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.screenContentFixed}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={common.between}>
        <Text variant="label" style={styles.eyebrow}>
          {eyebrow}
        </Text>
        {action}
      </View>
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {action && onPress && (
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.sectionLink}>
          <Text style={styles.linkText}>{action}</Text>
          <ArrowUpRight color={colors.amber} size={14} />
        </Pressable>
      )}
      {action && !onPress && <Text variant="caption">{action}</Text>}
    </View>
  );
}

export function Notice({
  message,
  onDismiss,
  cached = false,
}: {
  message: string;
  onDismiss?: () => void;
  cached?: boolean;
}) {
  return (
    <View style={styles.notice} accessibilityRole="alert">
      {cached ? (
        <CloudOff color={colors.amber} size={18} />
      ) : (
        <CircleAlert color={colors.amber} size={18} />
      )}
      <Text style={styles.noticeText}>{message}</Text>
      {onDismiss && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
          onPress={onDismiss}
          style={styles.dismiss}
        >
          <X color={colors.muted} size={17} />
        </Pressable>
      )}
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.empty} accessibilityLabel="Carregando previsão">
      <ActivityIndicator color={colors.amber} size="large" />
      <Text variant="heading">Buscando o céu de agora…</Text>
      <Text style={styles.centered}>Só um instante. Estamos consultando a previsão.</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <CloudOff size={32} color={colors.amber} strokeWidth={1.4} />
      </View>
      <Text variant="heading">O tempo não carregou.</Text>
      <Text style={styles.centered}>{message}</Text>
      <Button label="Tentar novamente" icon={RefreshCw} onPress={onRetry} />
    </View>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <View style={styles.emptyCompact}>
      <Icon color={colors.subtle} size={28} strokeWidth={1.5} />
      <Text variant="heading">{title}</Text>
      <Text style={styles.centered}>{description}</Text>
    </View>
  );
}

const typography = StyleSheet.create({
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fonts.semibold,
    letterSpacing: -1.1,
    color: colors.text,
  },
  heading: {
    fontSize: 17,
    lineHeight: 24,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  body: { fontSize: 13, lineHeight: 21, fontFamily: fonts.regular, color: colors.muted },
  caption: { fontSize: 11, lineHeight: 17, fontFamily: fonts.medium, color: colors.subtle },
  label: {
    fontSize: 10,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    letterSpacing: 1.9,
    color: colors.subtle,
  },
});

const styles = StyleSheet.create({
  text: { color: colors.text, fontFamily: fonts.regular },
  safeArea: { flex: 1, backgroundColor: colors.background, width: '100%' },
  screenContent: {
    padding: 24,
    paddingTop: 22,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 22,
  },
  screenContentFixed: {
    flex: 1,
    padding: 24,
    paddingTop: 22,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: 20,
  },
  header: { gap: 6 },
  eyebrow: { color: colors.amber, flex: 1 },
  subtitle: { marginTop: 1 },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.amber,
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.background, fontSize: 13, fontFamily: fonts.semibold },
  secondaryButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  secondaryButtonText: { color: colors.text },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  activeIconButton: { backgroundColor: colors.amberSoft, borderColor: '#6F5432' },
  sectionHeader: { ...common.between, minHeight: 40, marginBottom: 8 },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    paddingLeft: 8,
  },
  linkText: { fontSize: 11, color: colors.amber, fontFamily: fonts.medium },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: '#5B4930',
  },
  noticeText: { flex: 1, color: '#E2CDAA', fontSize: 12, lineHeight: 19 },
  dismiss: { width: 36, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 350, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCompact: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centered: { textAlign: 'center', maxWidth: 310 },
});

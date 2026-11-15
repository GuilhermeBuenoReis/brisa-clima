import { StyleSheet } from 'react-native';

export const colors = {
  background: '#101417',
  surface: '#191F23',
  elevated: '#222A30',
  border: '#2C353C',
  text: '#F4F2EC',
  muted: '#A1ABB3',
  subtle: '#77838C',
  amber: '#F3BF6B',
  amberSoft: '#342B20',
  blue: '#9CC4DC',
  green: '#A9CBB6',
  danger: '#F1A6A0',
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const common = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  body: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21 },
  label: { color: colors.subtle, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1.7 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

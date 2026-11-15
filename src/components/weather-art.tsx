import { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg';
import { colors } from '../theme';
import { describeWeather } from '../utils/weather';

export function WeatherIcon({
  code,
  isDay = true,
  size = 44,
}: {
  code: number;
  isDay?: boolean;
  size?: number;
}) {
  const { kind } = describeWeather(code, isDay);
  const cloudy = !['sun', 'moon'].includes(kind);
  const sunny = kind === 'sun' || kind === 'partly-cloudy';
  const moon = kind === 'moon' || (kind === 'partly-cloudy' && !isDay);
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      {sunny && !moon && (
        <G>
          <Circle
            cx={cloudy ? 25 : 32}
            cy={cloudy ? 24 : 31}
            r={cloudy ? 11 : 14}
            fill={colors.amber}
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <Line
              key={angle}
              x1={cloudy ? 25 : 32}
              y1={cloudy ? 7 : 9}
              x2={cloudy ? 25 : 32}
              y2={cloudy ? 10 : 13}
              stroke={colors.amber}
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${angle}, ${cloudy ? 25 : 32}, ${cloudy ? 24 : 31})`}
            />
          ))}
        </G>
      )}
      {moon && (
        <Path
          d={
            cloudy
              ? 'M32 9a15 15 0 1 0 16 21A17 17 0 0 1 32 9Z'
              : 'M39 9A23 23 0 1 0 55 42 25 25 0 0 1 39 9Z'
          }
          fill="#E9DDB2"
        />
      )}
      {cloudy && (
        <Path
          d="M16 45a10 10 0 1 1 1-20 15 15 0 0 1 28-1 11 11 0 1 1 4 21Z"
          fill={kind === 'partly-cloudy' ? '#C5D5DC' : '#A1B7C6'}
          stroke="#C9D7DF"
          strokeWidth="1"
        />
      )}
      {kind === 'rain' && (
        <G stroke={colors.blue} strokeWidth="3" strokeLinecap="round">
          <Line x1="20" y1="51" x2="17" y2="57" />
          <Line x1="33" y1="51" x2="30" y2="57" />
          <Line x1="46" y1="51" x2="43" y2="57" />
        </G>
      )}
      {kind === 'storm' && <Path d="M34 40 25 53h8l-2 10 15-17H36l4-6Z" fill={colors.amber} />}
      {kind === 'snow' && (
        <G fill="#DCE9F1">
          <Circle cx="20" cy="54" r="2.5" />
          <Circle cx="34" cy="57" r="2.5" />
          <Circle cx="47" cy="53" r="2.5" />
        </G>
      )}
      {kind === 'fog' && (
        <G stroke="#B6C9D4" strokeWidth="3" strokeLinecap="round">
          <Line x1="12" y1="51" x2="48" y2="51" />
          <Line x1="22" y1="58" x2="55" y2="58" />
        </G>
      )}
    </Svg>
  );
}

export function SkyLandscape({ isDay }: { isDay: boolean }) {
  return (
    <Svg
      width="100%"
      height="108"
      viewBox="0 0 400 108"
      preserveAspectRatio="none"
      accessible={false}
    >
      <Defs>
        <LinearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={isDay ? '#657E88' : '#495B71'} />
          <Stop offset="1" stopColor="#283941" />
        </LinearGradient>
      </Defs>
      <Path
        d="M-20 82C60 10 97 30 152 61s76-37 130-24 74-15 140-5V130H-20Z"
        fill="url(#hill)"
        opacity="0.52"
      />
      <Path
        d="M-20 103C60 76 97 97 168 79s90-47 149-32 73 18 105 2V130H-20Z"
        fill="#344B52"
        opacity="0.7"
      />
      <Path d="M-20 117C63 75 143 132 217 95s128-23 205-16V130H-20Z" fill="#26393E" />
      <Path
        d="M-20 103C60 76 97 97 168 79s90-47 149-32 73 18 105 2"
        fill="none"
        stroke="#8BA5AA"
        strokeWidth="0.7"
        opacity="0.25"
      />
    </Svg>
  );
}

export function SunArc({ progress }: { progress: number }) {
  const safeProgress = Math.min(1, Math.max(0, progress));
  const angle = Math.PI * (1 - safeProgress);
  const x = 150 + 126 * Math.cos(angle);
  const y = 106 - 76 * Math.sin(angle);
  return (
    <Svg width="100%" height="100" viewBox="0 0 300 120" accessible={false}>
      <Defs>
        <LinearGradient id="daylight" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.amber} stopOpacity="0.12" />
          <Stop offset="1" stopColor={colors.amber} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d="M24 106C24 4 276 4 276 106Z" fill="url(#daylight)" />
      <Path
        d="M24 106C24 4 276 4 276 106"
        fill="none"
        stroke="#746044"
        strokeWidth="1.4"
        strokeDasharray="4 6"
      />
      <Line x1="12" y1="106" x2="288" y2="106" stroke={colors.border} strokeWidth="1" />
      <Circle cx="24" cy="106" r="3" fill={colors.amber} />
      <Circle cx="276" cy="106" r="3" fill={colors.amber} />
      <Circle cx={x} cy={y} r="8" fill={colors.amber} />
    </Svg>
  );
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible={false}>
      <Circle cx="20" cy="17" r="7" fill={colors.amber} />
      <Path
        d="M5 27h22a6 6 0 1 0-6-6M10 33h21"
        stroke={colors.text}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Rect x="18.7" y="2" width="2.6" height="4" rx="1.3" fill={colors.amber} />
      <Path d="m7 7 3 3m20 0 3-3" stroke={colors.amber} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

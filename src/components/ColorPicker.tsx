import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, PanResponder, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';

const SAT = 45;                    // fixed saturation keeps results soft
const L_MIN = 55, L_MAX = 92;      // lightness range stays pastel

export function hslToHex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = (v: number) => Math.round(255 * v).toString(16).padStart(2, '0');
  return `#${x(f(0))}${x(f(8))}${x(f(4))}`.toUpperCase();
}

function hexToHsl(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, l: l * 100 };
}

const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

function Strip({ stops, fraction, onChange }: {
  stops: string[]; fraction: number; onChange: (f: number) => void;
}) {
  const [w, setW] = useState(1);
  const wRef = useRef(1);
  const cb = useRef(onChange);
  cb.current = onChange;

  const handle = (x: number) => cb.current(Math.min(1, Math.max(0, x / wRef.current)));

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => handle(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handle(e.nativeEvent.locationX),
    })
  ).current;

  return (
    <View
      style={s.strip}
      onLayout={(e) => { wRef.current = e.nativeEvent.layout.width; setW(e.nativeEvent.layout.width); }}
      {...pan.panHandlers}
    >
      <View style={s.stripRow} pointerEvents="none">
        {stops.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)}
      </View>
      <View pointerEvents="none" style={[s.thumb, { left: fraction * w - 11 }]} />
    </View>
  );
}

export default function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const init = isHex(value) ? hexToHsl(value) : { h: 270, l: 75 };
  const [hue, setHue] = useState(init.h);
  const [light, setLight] = useState(Math.min(L_MAX, Math.max(L_MIN, init.l)));
  const [text, setText] = useState(value.toUpperCase());

  useEffect(() => { setText(value.toUpperCase()); }, [value]);

  const update = (h: number, l: number) => {
    setHue(h); setLight(l);
    onChange(hslToHex(h, SAT, l));
  };

  const hueStops = Array.from({ length: 36 }, (_, i) => hslToHex(i * 10, SAT, 75));
  const lightStops = Array.from({ length: 20 }, (_, i) =>
    hslToHex(hue, SAT, L_MIN + ((L_MAX - L_MIN) * i) / 19));

  const onHex = (v: string) => {
    const t = v.startsWith('#') ? v : '#' + v;
    setText(t.toUpperCase());
    if (isHex(t)) {
      const { h, l } = hexToHsl(t);
      setHue(h);
      setLight(Math.min(L_MAX, Math.max(L_MIN, l)));
      onChange(t.toUpperCase());
    }
  };

  return (
    <View style={s.box}>
      <View style={s.top}>
        <View style={[s.preview, { backgroundColor: value }]} />
        <TextInput
          value={text} onChangeText={onHex} maxLength={7} autoCapitalize="characters"
          style={s.hex} placeholder="#C3B3D4" placeholderTextColor={colors.textMuted}
        />
      </View>
      <Text style={s.label}>Color</Text>
      <Strip stops={hueStops} fraction={hue / 360} onChange={(f) => update(f * 360, light)} />
      <Text style={s.label}>Softness</Text>
      <Strip stops={lightStops} fraction={(light - L_MIN) / (L_MAX - L_MIN)}
        onChange={(f) => update(hue, L_MIN + f * (L_MAX - L_MIN))} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.muted, padding: 14, marginTop: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.surface },
  hex: {
    flex: 1, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.muted, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.bold, fontSize: 15, color: colors.text,
  },
  label: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted, marginTop: 14, marginBottom: 8 },
  strip: { height: 28, borderRadius: 14, justifyContent: 'center' },
  stripRow: { flexDirection: 'row', height: 22, borderRadius: 11, overflow: 'hidden' },
  thumb: {
    position: 'absolute', top: 0, width: 22, height: 28, borderRadius: 11,
    borderWidth: 3, borderColor: colors.surface, backgroundColor: 'rgba(43,37,64,0.15)',
  },
});
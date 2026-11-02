import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme';

export default function SessionComplete() {
  const { minutes, subject } = useLocalSearchParams<{ minutes?: string; subject?: string }>();

  return (
    <View style={s.backdrop}>
      <View style={s.card}>
        <View style={s.icon}>
          <Ionicons name="sparkles-outline" size={30} color={colors.text} />
        </View>
        <Text style={s.title}>Great job!</Text>
        <Text style={s.body}>
          You focused for {minutes ?? '25'} min{subject ? ` on ${subject}` : ''}.
        </Text>

        <Pressable
          style={s.primary}
          onPress={() => router.replace({ pathname: '/(tabs)/focus', params: { mode: 'short' } })}
        >
          <Text style={s.primaryText}>Take a break</Text>
        </Pressable>
        <Pressable style={s.secondary} onPress={() => router.back()}>
          <Text style={s.secondaryText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(43,37,64,0.35)', justifyContent: 'center', padding: 28 },
  card: { backgroundColor: colors.bg, borderRadius: radius.lg, padding: 24, alignItems: 'center' },
  icon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.highlight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontFamily: fonts.heavy, fontSize: 24, color: colors.text },
  body: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  primary: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center' },
  primaryText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  secondary: { padding: 14 },
  secondaryText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
});
import { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '../theme';
import { storage } from '../lib/storage';
import Screen from '../components/Screen';
import Tap from '../components/Tap';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const start = async () => {
    if (!name.trim()) return setError('Tell us what to call you');
    await storage.setName(name.trim());
    router.replace('/(tabs)/home');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={s.wrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* soft decorative blobs */}
        <View style={[s.blob, { top: 30, right: -40, width: 160, height: 160, backgroundColor: colors.muted }]} />
        <View style={[s.blob, { top: 150, left: -50, width: 110, height: 110, backgroundColor: colors.highlight }]} />
        <View style={[s.blob, { bottom: 40, right: 10, width: 70, height: 70, backgroundColor: colors.secondary }]} />

        <View style={s.hero}>
          <View style={[s.logo, shadow.soft]}>
            <Ionicons name="sparkles" size={34} color={colors.text} />
          </View>
          <Text style={s.title}>Studyopia</Text>
          <Text style={s.tagline}>Plan. Focus. Achieve.</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>What should we call you?</Text>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setError(''); }}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            style={s.input}
            returnKeyType="done"
            onSubmitEditing={start}
            maxLength={24}
          />
          {!!error && <Text style={s.error}>{error}</Text>}

          <View style={{ marginTop: 18 }}>
            <Tap onPress={start} style={s.btn}>
              <Text style={s.btnText}>Get started</Text>
            </Tap>
          </View>
          <Text style={s.note}>No account needed. Everything stays on your phone.</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center', overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.8 },
  hero: { alignItems: 'center', marginBottom: 44 },
  logo: {
    width: 84, height: 84, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontFamily: fonts.heavy, fontSize: 36, color: colors.text },
  tagline: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, marginTop: 4 },
  form: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, ...shadow.soft },
  label: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted, marginBottom: 10 },
  input: {
    backgroundColor: colors.muted, borderRadius: radius.md, padding: 14,
    fontFamily: fonts.bold, fontSize: 16, color: colors.text,
  },
  error: { fontFamily: fonts.bold, fontSize: 13, color: '#B3425A', marginTop: 10 },
  btn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center', ...shadow.soft },
  btnText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  note: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 14 },
});
import { useState } from 'react';
import { Text, TextInput, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius } from '../theme';

export default function Onboarding() {
  const [name, setName] = useState('');

  const start = async () => {
    if (!name.trim()) return;
    await AsyncStorage.setItem('userName', name.trim());
    router.replace('/(tabs)/home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: 'center', gap: 16 }}>
      <Text style={{ fontFamily: fonts.heavy, fontSize: 32, color: colors.text }}>Welcome to Studyopia</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted }}>
        What should we call u?
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Ur name"
        placeholderTextColor={colors.textMuted}
        style={{
          backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.muted,
          borderRadius: radius.md, padding: 14, fontFamily: fonts.bold, fontSize: 16, color: colors.text,
        }}
      />
      <Pressable
        onPress={start}
        style={{ backgroundColor: colors.primary, borderRadius: radius.pill, padding: 16, alignItems: 'center' }}
      >
        <Text style={{ fontFamily: fonts.heavy, fontSize: 16, color: colors.text }}>Get started</Text>
      </Pressable>
    </View>
  );
}
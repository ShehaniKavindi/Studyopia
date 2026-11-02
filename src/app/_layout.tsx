import { Stack } from 'expo-router';
import { useFonts, Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';

export default function RootLayout() {
  const [loaded] = useFonts({ Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold });
  if (!loaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add-task" options={{ presentation: 'modal' }} />
      <Stack.Screen name="session-complete" options={{ presentation: 'transparentModal' }} />
    </Stack>
  );
}
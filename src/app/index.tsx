import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [hasName, setHasName] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('userName')
      .then((n) => setHasName(!!n?.trim()))
      .catch(() => setHasName(false))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <Redirect href={(hasName ? '/(tabs)/home' : '/onboarding') as any} />;
}
import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export default function Bar({ pct, color, track, height = 10 }: {
  pct: number; color: string; track: string; height?: number;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: Math.min(1, Math.max(0, pct)), duration: 600, useNativeDriver: false }).start();
  }, [pct]);
  const width = v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={{ width, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}
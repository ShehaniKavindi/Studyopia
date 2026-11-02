import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../theme';

export default function Card({ children, tint, style }: {
  children: ReactNode; tint?: string; style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ backgroundColor: tint ?? colors.surface, borderRadius: radius.lg, padding: 16 }, shadow.soft, style]}>
      {children}
    </View>
  );
}
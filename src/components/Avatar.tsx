import { Image, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export default function Avatar({ uri, name, size = 44 }: { uri?: string | null; name?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.muted }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: fonts.heavy, fontSize: size * 0.4, color: colors.text }}>
        {(name?.[0] ?? 'S').toUpperCase()}
      </Text>
    </View>
  );
}
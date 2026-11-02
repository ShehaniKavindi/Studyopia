import { Text, View } from 'react-native';
import { colors, fonts } from '../../theme';

export default function Screen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <Text style={{ fontFamily: fonts.heavy, fontSize: 22, color: colors.text }}>Add</Text>
    </View>
  );
}

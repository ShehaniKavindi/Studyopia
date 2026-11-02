import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { Subject } from '../lib/storage';
import { suggestIcon, DEFAULT_ICON, IconName } from '../lib/subjectIcons';

export default function SubjectIcon({ subject, size = 42 }: { subject?: Subject | null; size?: number }) {
  const name = (subject?.icon as IconName | undefined) ?? (subject ? suggestIcon(subject.name) : DEFAULT_ICON);
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.33,
        backgroundColor: subject?.color ?? colors.muted,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={size * 0.5} color={colors.text} />
    </View>
  );
}
import { Tabs, router } from 'expo-router';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 11 },
        tabBarStyle: styles.bar,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home',
        tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner',
        tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={22} color={color} /> }} />

      {/* center + button: a fake tab that opens the modal */}
      <Tabs.Screen
        name="add"
        options={{
            title: '',
            tabBarButton: () => (
            <View style={styles.fabWrap}>
                <Pressable style={styles.fab} onPress={() => router.push('/add-task')}>
                <Ionicons name="add" size={28} color={colors.text} />
                </Pressable>
            </View>
            ),
        }}
        />

      <Tabs.Screen name="focus" options={{ title: 'Focus',
        tabBarIcon: ({ color }) => <Ionicons name="timer-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress',
        tabBarIcon: ({ color }) => <Ionicons name="stats-chart-outline" size={22} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', left: 12, right: 12, bottom: 12,
    height: 68, borderRadius: 28, borderTopWidth: 0,
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.muted,
    shadowColor: colors.primary, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  fab: {
    width: 52, height: 52, borderRadius: 26, marginTop: 8,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  fabWrap: { 
    flex: 1, alignItems: 'center', justifyContent: 'center' 
    },
});
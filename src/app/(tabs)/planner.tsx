import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '../../theme';
import { storage, Task, Subject } from '../../lib/storage';
import { toKey, addDays, startOfWeek, DAY_NAMES } from '../../lib/dates';
import SubjectIcon from '../../components/SubjectIcon';
import Screen from '../../components/Screen';
import Tap from '../../components/Tap';

export default function Planner() {
  const [selected, setSelected] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const load = useCallback(async () => {
    setSubjects(await storage.seedSubjects());
    setTasks(await storage.getTasks());
  }, []);

  // reload every time the tab or the modal returns
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const todayKey = toKey(new Date());
  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const key = toKey(selected);

  const daysWithTasks = new Set(tasks.map((t) => t.date));
  const dayTasks = tasks
    .filter((t) => t.date === key)
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  const doneCount = dayTasks.filter((t) => t.done).length;

  const toggle = async (t: Task) => {
    await storage.updateTask(t.id, { done: !t.done });
    setTasks(await storage.getTasks());
  };

  const monthLabel = selected.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 130 }}>
        {/* header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Planner</Text>
            <Text style={s.month}>{monthLabel}</Text>
          </View>
          <View style={s.weekNav}>
            {key !== todayKey && (
              <Pressable onPress={() => setSelected(new Date())} style={s.todayBtn} hitSlop={6}>
                <Text style={s.todayText}>Today</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setSelected(addDays(selected, -7))} hitSlop={10} style={s.arrow}>
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => setSelected(addDays(selected, 7))} hitSlop={10} style={s.arrow}>
              <Ionicons name="chevron-forward" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* week strip */}
        <View style={s.strip}>
          {days.map((d, i) => {
            const k = toKey(d);
            const active = k === key;
            return (
              <Pressable key={i} onPress={() => setSelected(d)} style={[s.day, active && s.dayActive]}>
                <Text style={s.dayName}>{DAY_NAMES[i]}</Text>
                <Text style={s.dayNum}>{d.getDate()}</Text>
                <View
                  style={[
                    s.dot,
                    { backgroundColor: daysWithTasks.has(k) ? (active ? colors.text : colors.primary) : 'transparent' },
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        {/* tasks */}
        <View style={s.listHeader}>
          <Text style={s.section}>Tasks</Text>
          <Text style={s.count}>{doneCount}/{dayTasks.length} done</Text>
        </View>

        {dayTasks.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="leaf-outline" size={30} color={colors.text} />
            </View>
            <Text style={s.emptyTitle}>Nothing planned</Text>
            <Text style={s.emptyText}>Tap + to add a task for this day.</Text>
          </View>
        )}

        {dayTasks.map((t) => {
          const subj = subjects.find((x) => x.id === t.subjectId);
          return (
            <View key={t.id} style={{ marginBottom: 12 }}>
              <Tap
                onPress={() => router.push({ pathname: '/add-task', params: { id: t.id } })}
                style={s.card}
              >
                <Pressable
                  onPress={() => toggle(t)}
                  hitSlop={8}
                  style={[s.check, t.done && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  {t.done && <Ionicons name="checkmark" size={16} color={colors.text} />}
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={[s.taskTitle, t.done && s.done]}>{t.title}</Text>
                  <Text style={s.meta}>
                    {[subj?.name, t.time].filter(Boolean).join(' · ') || 'No subject'}
                  </Text>
                </View>
                <SubjectIcon subject={subj} size={34} />
              </Tap>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  title: { fontFamily: fonts.heavy, fontSize: 26, color: colors.text },
  month: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  weekNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  todayBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.highlight },
  todayText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.text },

  strip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 24 },
  day: {
    width: 44, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md,
    backgroundColor: colors.surface, ...shadow.soft,
  },
  dayActive: { backgroundColor: colors.secondary },
  dayName: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted },
  dayNum: { fontFamily: fonts.heavy, fontSize: 17, color: colors.text, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 5 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  section: { fontFamily: fonts.heavy, fontSize: 18, color: colors.text },
  count: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },

  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyIcon: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: colors.muted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: colors.surface, borderRadius: radius.md, ...shadow.soft,
  },
  check: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  taskTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  done: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
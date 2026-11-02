import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme';
import { storage, Task, Subject } from '../../lib/storage';
import { toKey, addDays, startOfWeek, DAY_NAMES } from '../../lib/dates';

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

  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const key = toKey(selected);
  const dayTasks = tasks
    .filter((t) => t.date === key)
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));

  const toggle = async (t: Task) => {
    await storage.updateTask(t.id, { done: !t.done });
    setTasks(await storage.getTasks());
  };

  const monthLabel = selected.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* header */}
        <View style={s.header}>
          <Text style={s.title}>Planner</Text>
          <View style={s.weekNav}>
            <Pressable onPress={() => setSelected(addDays(selected, -7))} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => setSelected(addDays(selected, 7))} hitSlop={10}>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
        <Text style={s.month}>{monthLabel}</Text>

        {/* week strip */}
        <View style={s.strip}>
          {days.map((d, i) => {
            const active = toKey(d) === key;
            return (
              <Pressable key={i} onPress={() => setSelected(d)} style={[s.day, active && s.dayActive]}>
                <Text style={[s.dayName, active && { color: colors.text }]}>{DAY_NAMES[i]}</Text>
                <Text style={s.dayNum}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* tasks */}
        <View style={s.listHeader}>
          <Text style={s.section}>Tasks</Text>
          <Text style={s.count}>
            {dayTasks.filter((t) => t.done).length}/{dayTasks.length} done
          </Text>
        </View>

        {dayTasks.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="leaf-outline" size={32} color={colors.textMuted} />
            <Text style={s.emptyText}>No tasks yet. Tap + to add one.</Text>
          </View>
        )}

        {dayTasks.map((t) => {
          const subj = subjects.find((x) => x.id === t.subjectId);
          return (
            <Pressable
              key={t.id}
              style={s.card}
              onPress={() => router.push({ pathname: '/add-task', params: { id: t.id } })}
            >
              <Pressable onPress={() => toggle(t)} hitSlop={8}
                style={[s.check, t.done && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {t.done && <Ionicons name="checkmark" size={16} color={colors.text} />}
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={[s.taskTitle, t.done && s.done]}>{t.title}</Text>
                <Text style={s.meta}>
                  {[subj?.name, t.time].filter(Boolean).join(' · ') || 'No subject'}
                </Text>
              </View>
              <View style={[s.dot, { backgroundColor: subj?.color ?? colors.muted }]} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 },
  title: { fontFamily: fonts.heavy, fontSize: 26, color: colors.text },
  weekNav: { flexDirection: 'row', gap: 14 },
  month: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  strip: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 22 },
  day: {
    width: 44, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.muted,
  },
  dayActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  dayName: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted },
  dayNum: { fontFamily: fonts.heavy, fontSize: 17, color: colors.text, marginTop: 2 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  section: { fontFamily: fonts.heavy, fontSize: 18, color: colors.text },
  count: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontFamily: fonts.bold, color: colors.textMuted },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.muted,
  },
  check: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  taskTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  done: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
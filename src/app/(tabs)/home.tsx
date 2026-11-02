import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, fonts, radius } from '../../theme';
import { storage, Task, Subject, Session } from '../../lib/storage';
import { toKey } from '../../lib/dates';
import Avatar from '../../components/Avatar';
import { minutesOn, streak, formatMinutes } from '../../lib/stats';

export default function Home() {
  const [name, setName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setName((await storage.getName()) ?? '');
        setAvatar(await storage.getAvatar());
        setSubjects(await storage.seedSubjects());
        setTasks(await storage.getTasks());
        setSessions(await storage.getSessions());
      })();
    }, [])
  );

  const todayKey = toKey(new Date());
  const today = tasks
    .filter((t) => t.date === todayKey)
    .sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'));
  const done = today.filter((t) => t.done).length;
  const pct = today.length ? done / today.length : 0;

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      {/* header */}
      <View style={s.header}>
        <View>
          <Text style={s.hi}>Hi, {name || 'there'}</Text>
          <Text style={s.sub}>Ready to focus today?</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')}>
        <Avatar uri={avatar} name={name} size={44} />
        </Pressable>
      </View>

      {/* daily goal */}
      <View style={s.goal}>
        <Text style={s.goalLabel}>Daily goal</Text>
        <Text style={s.goalNum}>
          {done} <Text style={s.goalOf}>/ {today.length} tasks</Text>
        </Text>
        <View style={s.track}>
          <View style={[s.fill, { width: `${pct * 100}%` }]} />
        </View>
        <Text style={s.goalMsg}>
          {today.length === 0
            ? 'Add a task to start your day.'
            : done === today.length
            ? 'All done. Nice work!'
            : 'Small steps every day lead to big results.'}
        </Text>
      </View>

      {/* stats */}
      <View style={s.row}>
        <View style={[s.stat, { backgroundColor: colors.highlight }]}>
          <Text style={s.statLabel}>Study streak</Text>
          <Text style={s.statNum}>{streak(sessions)} days</Text>
        </View>
        <View style={[s.stat, { backgroundColor: colors.muted }]}>
          <Text style={s.statLabel}>Focus today</Text>
          <Text style={s.statNum}>{formatMinutes(minutesOn(sessions, todayKey))}</Text>
        </View>
      </View>

      {/* schedule */}
      <View style={s.listHeader}>
        <Text style={s.section}>Today's schedule</Text>
        <Pressable onPress={() => router.push('/(tabs)/planner')} hitSlop={10}>
          <Text style={s.viewAll}>View all</Text>
        </Pressable>
      </View>

      {today.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>Nothing planned for today.</Text>
        </View>
      )}

      {today.map((t) => {
        const subj = subjects.find((x) => x.id === t.subjectId);
        return (
          <Pressable
            key={t.id}
            style={s.card}
            onPress={() => router.push({ pathname: '/add-task', params: { id: t.id } })}
          >
            <View style={[s.badge, { backgroundColor: subj?.color ?? colors.muted }]}>
              <Text style={s.badgeText}>{(subj?.name ?? t.title)[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.taskTitle, t.done && s.doneText]}>{t.title}</Text>
              <Text style={s.meta}>{subj?.name ?? 'No subject'}</Text>
            </View>
            <Text style={s.time}>{t.time ?? ''}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 },
  hi: { fontFamily: fonts.heavy, fontSize: 24, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heavy, fontSize: 17, color: colors.text },

  goal: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 20, marginTop: 20, gap: 10 },
  goalLabel: { fontFamily: fonts.heavy, fontSize: 13, color: colors.text },
  goalNum: { fontFamily: fonts.heavy, fontSize: 34, color: colors.text },
  goalOf: { fontFamily: fonts.bold, fontSize: 16 },
  track: { height: 10, borderRadius: 10, backgroundColor: colors.muted, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 10, backgroundColor: 'rgba(43,37,64,0.75)' },
  goalMsg: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },

  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: { flex: 1, borderRadius: 20, padding: 14 },
  statLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
  statNum: { fontFamily: fonts.heavy, fontSize: 22, color: colors.text, marginTop: 2 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24, marginBottom: 10 },
  section: { fontFamily: fonts.heavy, fontSize: 18, color: colors.text },
  viewAll: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted },
  empty: { paddingVertical: 28, alignItems: 'center' },
  emptyText: { fontFamily: fonts.bold, color: colors.textMuted },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10,
    backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.muted,
  },
  badge: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  taskTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  doneText: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  time: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
});
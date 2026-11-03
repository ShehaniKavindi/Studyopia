import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, fonts, radius, shadow } from '../../theme';
import { storage, Task, Subject, Session } from '../../lib/storage';
import { toKey } from '../../lib/dates';
import { minutesOn, streak, formatMinutes } from '../../lib/stats';
import Avatar from '../../components/Avatar';
import SubjectIcon from '../../components/SubjectIcon';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Bar from '../../components/Bar';
import Tap from '../../components/Tap';

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

  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen>
      <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 130 }}>
        {/* header */}
        <View style={s.header}>
          <View>
            <Text style={s.hi}>{greeting}, {name || 'there'}</Text>
            <Text style={s.sub}>Ready to focus today?</Text>
          </View>
          <Pressable onPress={() => router.push('/settings')}>
            <View style={[s.avatarRing, shadow.soft]}>
              <Avatar uri={avatar} name={name} size={44} />
            </View>
          </Pressable>
        </View>

        {/* daily goal */}
        <Card tint={colors.primary} style={s.goal}>
          <Text style={s.goalLabel}>Daily goal</Text>
          <Text style={s.goalNum}>
            {done} <Text style={s.goalOf}>/ {today.length} tasks</Text>
          </Text>
          <Bar pct={pct} color="rgba(43,37,64,0.75)" track="rgba(255,255,255,0.65)" />
          <Text style={s.goalMsg}>
            {today.length === 0
              ? 'Add a task to start your day.'
              : done === today.length
              ? 'All done. Nice work!'
              : 'Small steps every day lead to big results.'}
          </Text>
        </Card>

        {/* stats */}
        <View style={s.row}>
          <Card tint={colors.highlight} style={s.stat}>
            <Text style={s.statLabel}>Study streak</Text>
            <Text style={s.statNum}>{streak(sessions)} days</Text>
          </Card>
          <Card tint={colors.muted} style={s.stat}>
            <Text style={s.statLabel}>Focus today</Text>
            <Text style={s.statNum}>{formatMinutes(minutesOn(sessions, todayKey))}</Text>
          </Card>
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
            <View key={t.id} style={{ marginBottom: 12 }}>
              <Tap
                onPress={() => router.push({ pathname: '/add-task', params: { id: t.id } })}
                style={s.task}
              >
                <SubjectIcon subject={subj} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.taskTitle, t.done && s.doneText]}>{t.title}</Text>
                  <Text style={s.meta}>{subj?.name ?? 'No subject'}</Text>
                </View>
                <Text style={s.time}>{t.time ?? ''}</Text>
              </Tap>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  hi: { fontFamily: fonts.heavy, fontSize: 24, color: colors.text },
  sub: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  avatarRing: { borderRadius: 26, padding: 3, backgroundColor: colors.surface },

  goal: { marginTop: 20, padding: 20, gap: 12 },
  goalLabel: { fontFamily: fonts.heavy, fontSize: 13, color: colors.text },
  goalNum: { fontFamily: fonts.heavy, fontSize: 36, color: colors.text },
  goalOf: { fontFamily: fonts.bold, fontSize: 16 },
  goalMsg: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },

  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  stat: { flex: 1, padding: 14, borderRadius: 20 },
  statLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
  statNum: { fontFamily: fonts.heavy, fontSize: 22, color: colors.text, marginTop: 2 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 26, marginBottom: 12 },
  section: { fontFamily: fonts.heavy, fontSize: 18, color: colors.text },
  viewAll: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted },
  empty: { paddingVertical: 28, alignItems: 'center' },
  emptyText: { fontFamily: fonts.bold, color: colors.textMuted },

  task: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    ...shadow.soft,
  },
  taskTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  doneText: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  time: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
});
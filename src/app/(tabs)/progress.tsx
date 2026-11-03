import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '../../theme';
import { storage, Task, Subject, Session } from '../../lib/storage';
import { toKey, addDays, startOfWeek, DAY_NAMES } from '../../lib/dates';
import { formatMinutes } from '../../lib/stats';
import Screen from '../../components/Screen';
import Card from '../../components/Card';
import ProgressBar from '../../components/Bar';
import SubjectIcon from '../../components/SubjectIcon';

type Range = 'week' | 'month';
type BarData = { label: string; minutes: number; isToday: boolean };

const BAR_AREA = 120;

export default function Progress() {
  const [range, setRange] = useState<Range>('week');
  const [anchor, setAnchor] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setSubjects(await storage.seedSubjects());
        setTasks(await storage.getTasks());
        setSessions(await storage.getSessions());
      })();
    }, [])
  );

  const todayKey = toKey(new Date());

  // ---- build the days in the selected range ----
  let days: Date[];
  let title: string;
  if (range === 'week') {
    const start = startOfWeek(anchor);
    days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const f = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    title = `${f(days[0])} - ${f(days[6])}`;
  } else {
    const y = anchor.getFullYear();
    const m = anchor.getMonth();
    const count = new Date(y, m + 1, 0).getDate();
    days = Array.from({ length: count }, (_, i) => new Date(y, m, i + 1));
    title = anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const keys = new Set(days.map(toKey));

  const inRange = sessions.filter((x) => keys.has(toKey(new Date(x.startedAt))));
  const minutesFor = (k: string) =>
    inRange.filter((x) => toKey(new Date(x.startedAt)) === k).reduce((a, x) => a + x.minutes, 0);

  // ---- bars: 7 days for a week, weekly buckets for a month ----
  let bars: BarData[];
  if (range === 'week') {
    bars = days.map((d, i) => ({
      label: DAY_NAMES[i][0],
      minutes: minutesFor(toKey(d)),
      isToday: toKey(d) === todayKey,
    }));
  } else {
    const weeks = Math.ceil(days.length / 7);
    bars = Array.from({ length: weeks }, (_, w) => {
      const slice = days.slice(w * 7, w * 7 + 7);
      return {
        label: `W${w + 1}`,
        minutes: slice.reduce((a, d) => a + minutesFor(toKey(d)), 0),
        isToday: slice.some((d) => toKey(d) === todayKey),
      };
    });
  }
  const max = Math.max(...bars.map((b) => b.minutes), 1);

  // ---- stats ----
  const totalMinutes = inRange.reduce((a, x) => a + x.minutes, 0);
  const tasksDone = tasks.filter((t) => t.done && keys.has(t.date)).length;
  const tasksAll = tasks.filter((t) => keys.has(t.date)).length;

  // ---- minutes per subject ----
  const bySubject = new Map<string, number>();
  inRange.forEach((x) => {
    const k = x.subjectId ?? 'none';
    bySubject.set(k, (bySubject.get(k) ?? 0) + x.minutes);
  });
  const subjectRows = [...bySubject.entries()]
    .map(([id, minutes]) => {
      const sub = subjects.find((x) => x.id === id);
      return { id, minutes, sub, name: sub?.name ?? 'No subject', color: sub?.color ?? colors.primary };
    })
    .sort((a, b) => b.minutes - a.minutes);

  const step = (dir: 1 | -1) =>
    setAnchor(
      range === 'week'
        ? addDays(anchor, 7 * dir)
        : new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1)
    );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 130 }}>
        <Text style={s.title}>Progress</Text>

        {/* week / month toggle */}
        <View style={s.toggle}>
          {(['week', 'month'] as Range[]).map((r) => (
            <Pressable
              key={r}
              onPress={() => { setRange(r); setAnchor(new Date()); }}
              style={[s.toggleBtn, range === r && s.toggleOn]}
            >
              <Text style={[s.toggleText, range === r && { color: colors.text }]}>
                {r === 'week' ? 'This week' : 'This month'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* range navigator */}
        <View style={s.nav}>
          <Pressable onPress={() => step(-1)} hitSlop={10} style={s.arrow}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={s.navTitle}>{title}</Text>
          <Pressable onPress={() => step(1)} hitSlop={10} style={s.arrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* chart card */}
        <Card style={{ padding: 18 }}>
          <Text style={s.cardLabel}>Study time</Text>
          <Text style={s.big}>{formatMinutes(totalMinutes)}</Text>

          <View style={s.chart}>
            {bars.map((b, i) => {
              const h = b.minutes ? Math.max(8, (b.minutes / max) * BAR_AREA) : 6;
              return (
                <View key={i} style={s.barCol}>
                  <Text style={s.barValue}>{b.minutes ? formatMinutes(b.minutes) : ''}</Text>
                  <View
                    style={[
                      s.bar,
                      { height: h, backgroundColor: b.minutes ? colors.primary : colors.muted },
                      b.isToday && b.minutes > 0 && { backgroundColor: colors.secondary, borderWidth: 2, borderColor: colors.primary },
                    ]}
                  />
                  <Text style={[s.barLabel, b.isToday && { color: colors.text }]}>{b.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* stats */}
        <View style={s.row}>
          <Card tint={colors.highlight} style={s.stat}>
            <Text style={s.statLabel}>Tasks completed</Text>
            <Text style={s.statNum}>
              {tasksDone}<Text style={s.statOf}> / {tasksAll}</Text>
            </Text>
          </Card>
          <Card tint={colors.muted} style={s.stat}>
            <Text style={s.statLabel}>Focus sessions</Text>
            <Text style={s.statNum}>{inRange.length}</Text>
          </Card>
        </View>

        {/* subjects */}
        <Text style={s.section}>Subjects</Text>
        {subjectRows.length === 0 && (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="leaf-outline" size={30} color={colors.text} />
            </View>
            <Text style={s.emptyTitle}>No sessions yet</Text>
            <Text style={s.emptyText}>Finish a focus session to see your time here.</Text>
          </View>
        )}
        {subjectRows.map((r) => {
          const pct = totalMinutes ? r.minutes / totalMinutes : 0;
          return (
            <Card key={r.id} style={s.subject}>
              <View style={s.subjectTop}>
                <SubjectIcon subject={r.sub} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={s.subjectName}>{r.name}</Text>
                  <Text style={s.subjectMeta}>{formatMinutes(r.minutes)} · {Math.round(pct * 100)}%</Text>
                </View>
              </View>
              <ProgressBar pct={pct} color={r.color} track={colors.muted} />
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: fonts.heavy, fontSize: 26, color: colors.text, marginTop: 12 },

  toggle: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.pill, padding: 4, marginTop: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  toggleOn: { backgroundColor: colors.surface, ...shadow.soft },
  toggleText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted },

  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 14 },
  arrow: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  navTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },

  cardLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
  big: { fontFamily: fonts.heavy, fontSize: 30, color: colors.text, marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, marginTop: 18 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontFamily: fonts.bold, fontSize: 9, color: colors.textMuted, height: 14 },
  bar: { width: '70%', borderRadius: 10 },
  barLabel: { fontFamily: fonts.heavy, fontSize: 11, color: colors.textMuted, marginTop: 6 },

  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stat: { flex: 1, padding: 14, borderRadius: 20 },
  statLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
  statNum: { fontFamily: fonts.heavy, fontSize: 24, color: colors.text, marginTop: 2 },
  statOf: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },

  section: { fontFamily: fonts.heavy, fontSize: 18, color: colors.text, marginTop: 26, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: colors.muted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyTitle: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  subject: { marginBottom: 12, padding: 14, gap: 12, borderRadius: radius.md },
  subjectTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subjectName: { fontFamily: fonts.heavy, fontSize: 14, color: colors.text },
  subjectMeta: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, marginTop: 1 },
});
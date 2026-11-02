import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme';
import { storage, Task, Subject, Session } from '../../lib/storage';
import { toKey, addDays, startOfWeek, DAY_NAMES } from '../../lib/dates';
import { formatMinutes } from '../../lib/stats';
import Screen from '../../components/Screen';

type Range = 'week' | 'month';
type Bar = { label: string; minutes: number };

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

  // ---- build the days in the selected range ----
  let days: Date[];
  let title: string;
  if (range === 'week') {
    const start = startOfWeek(anchor);
    days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const end = days[6];
    const f = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    title = `${f(days[0])} - ${f(end)}`;
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
  let bars: Bar[];
  if (range === 'week') {
    bars = days.map((d, i) => ({ label: DAY_NAMES[i][0], minutes: minutesFor(toKey(d)) }));
  } else {
    const weeks = Math.ceil(days.length / 7);
    bars = Array.from({ length: weeks }, (_, w) => ({
      label: `W${w + 1}`,
      minutes: days.slice(w * 7, w * 7 + 7).reduce((a, d) => a + minutesFor(toKey(d)), 0),
    }));
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
      return { id, minutes, name: sub?.name ?? 'No subject', color: sub?.color ?? colors.muted };
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
        <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={s.title}>Progress</Text>

        {/* week / month toggle */}
        <View style={s.toggle}>
            {(['week', 'month'] as Range[]).map((r) => (
            <Pressable key={r} onPress={() => { setRange(r); setAnchor(new Date()); }}
                style={[s.toggleBtn, range === r && s.toggleOn]}>
                <Text style={[s.toggleText, range === r && { color: colors.text }]}>
                {r === 'week' ? 'This week' : 'This month'}
                </Text>
            </Pressable>
            ))}
        </View>

        {/* range navigator */}
        <View style={s.nav}>
            <Pressable onPress={() => step(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={s.navTitle}>{title}</Text>
            <Pressable onPress={() => step(1)} hitSlop={10}>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </Pressable>
        </View>

        {/* chart card */}
        <View style={s.card}>
            <Text style={s.cardLabel}>Study time</Text>
            <Text style={s.big}>{formatMinutes(totalMinutes)}</Text>

            <View style={s.chart}>
            {bars.map((b, i) => {
                const h = b.minutes ? Math.max(8, (b.minutes / max) * BAR_AREA) : 6;
                return (
                <View key={i} style={s.barCol}>
                    <Text style={s.barValue}>{b.minutes ? formatMinutes(b.minutes) : ''}</Text>
                    <View style={[s.bar, { height: h, backgroundColor: b.minutes ? colors.primary : colors.muted }]} />
                    <Text style={s.barLabel}>{b.label}</Text>
                </View>
                );
            })}
            </View>
        </View>

        {/* stats */}
        <View style={s.row}>
            <View style={[s.stat, { backgroundColor: colors.highlight }]}>
            <Text style={s.statLabel}>Tasks completed</Text>
            <Text style={s.statNum}>{tasksDone}<Text style={s.statOf}> / {tasksAll}</Text></Text>
            </View>
            <View style={[s.stat, { backgroundColor: colors.muted }]}>
            <Text style={s.statLabel}>Focus sessions</Text>
            <Text style={s.statNum}>{inRange.length}</Text>
            </View>
        </View>

        {/* subjects */}
        <Text style={s.section}>Subjects</Text>
        {subjectRows.length === 0 && (
            <View style={s.empty}>
            <Ionicons name="leaf-outline" size={30} color={colors.textMuted} />
            <Text style={s.emptyText}>No focus sessions in this range yet.</Text>
            </View>
        )}
        {subjectRows.map((r) => {
            const pct = totalMinutes ? r.minutes / totalMinutes : 0;
            return (
            <View key={r.id} style={s.subject}>
                <View style={s.subjectTop}>
                <Text style={s.subjectName}>{r.name}</Text>
                <Text style={s.subjectMeta}>{formatMinutes(r.minutes)} · {Math.round(pct * 100)}%</Text>
                </View>
                <View style={s.track}>
                <View style={[s.fill, { width: `${pct * 100}%` as `${number}%`, backgroundColor: r.color }]} />
                </View>
            </View>
            );
        })}
        </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.heavy, fontSize: 26, color: colors.text, marginTop: 12 },

  toggle: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.pill, padding: 4, marginTop: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  toggleOn: { backgroundColor: colors.surface },
  toggleText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted },

  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  navTitle: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.muted, padding: 18 },
  cardLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
  big: { fontFamily: fonts.heavy, fontSize: 30, color: colors.text, marginTop: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, marginTop: 18 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontFamily: fonts.bold, fontSize: 9, color: colors.textMuted, height: 14 },
  bar: { width: '70%', borderRadius: 10 },
  barLabel: { fontFamily: fonts.heavy, fontSize: 11, color: colors.textMuted, marginTop: 6 },

  row: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stat: { flex: 1, borderRadius: 20, padding: 14 },
  statLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
  statNum: { fontFamily: fonts.heavy, fontSize: 24, color: colors.text, marginTop: 2 },
  statOf: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },

  section: { fontFamily: fonts.heavy, fontSize: 18, color: colors.text, marginTop: 24, marginBottom: 10 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyText: { fontFamily: fonts.bold, color: colors.textMuted },
  subject: { marginBottom: 14 },
  subjectTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subjectName: { fontFamily: fonts.heavy, fontSize: 14, color: colors.text },
  subjectMeta: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
  track: { height: 10, borderRadius: 10, backgroundColor: colors.muted, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 10 },
});
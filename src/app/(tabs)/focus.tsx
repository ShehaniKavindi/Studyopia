import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Vibration } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '../../theme';
import { storage, Subject, Session, DEFAULT_SETTINGS } from '../../lib/storage';
import { toKey } from '../../lib/dates';
import { formatMinutes } from '../../lib/stats';
import Screen from '../../components/Screen';

type Mode = 'focus' | 'short' | 'long';
const LABELS: Record<Mode, string> = { focus: 'Pomodoro', short: 'Short break', long: 'Long break' };

const SIZE = 260;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const fmt = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export default function Focus() {
  const params = useLocalSearchParams<{ mode?: string }>();

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [subjectId, setSubjectId] = useState<string | undefined>();

  const [mode, setMode] = useState<Mode>('focus');
  const [remaining, setRemaining] = useState(DEFAULT_SETTINGS.focus * 60);
  const [running, setRunning] = useState(false);

  const endAt = useRef(0);        // timestamp when the timer hits 0
  const finished = useRef(false); // stops double-firing

  const total = settings[mode] * 60;

  const load = useCallback(async () => {
    const st = await storage.getSettings();
    setSettings(st);
    setSubjects(await storage.seedSubjects());
    setSessions(await storage.getSessions());
    return st;
  }, []);

  // reload when the tab is focused (settings may have changed)
  useFocusEffect(
    useCallback(() => {
      load().then((st) => {
        if (!running) setRemaining(st[mode] * 60);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load, mode])
  );

  // "Take a break" from the Session Complete popup sends ?mode=short
  useEffect(() => {
    if (params.mode === 'short' || params.mode === 'long') {
      setMode(params.mode);
      setRunning(false);
      setRemaining(settings[params.mode] * 60);
      router.setParams({ mode: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.mode]);

  // the timer: compares timestamps, so it stays correct in the background
  useEffect(() => {
    if (!running) return;

    const complete = async () => {
      setRunning(false);
      Vibration.vibrate([0, 400, 200, 400]);

      if (mode === 'focus') {
        const minutes = settings.focus;
        await storage.addSession({
          subjectId,
          minutes,
          startedAt: new Date(endAt.current - total * 1000).toISOString(),
        });
        setSessions(await storage.getSessions());
        setRemaining(total);
        router.push({
          pathname: '/session-complete',
          params: { minutes: String(minutes), subject: subjects.find((x) => x.id === subjectId)?.name ?? '' },
        });
      } else {
        setMode('focus');
        setRemaining(settings.focus * 60);
      }
    };

    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !finished.current) {
        finished.current = true;
        complete();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, mode, subjectId, settings, subjects, total]);

  const start = () => {
    endAt.current = Date.now() + remaining * 1000;
    finished.current = false;
    setRunning(true);
  };
  const pause = () => {
    setRemaining(Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000)));
    setRunning(false);
  };
  const reset = () => {
    setRunning(false);
    setRemaining(total);
  };
  const switchMode = (m: Mode) => {
    if (running) return;
    setMode(m);
    setRemaining(settings[m] * 60);
  };

  const todayKey = toKey(new Date());
  const todays = sessions.filter((x) => toKey(new Date(x.startedAt)) === todayKey);
  const todayMinutes = todays.reduce((sum, x) => sum + x.minutes, 0);
  const fraction = total ? remaining / total : 0;

  return (
    <Screen>
        <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingBottom: 120, alignItems: 'center' }}>
        <Text style={s.title}>Focus</Text>

        {/* mode tabs */}
        <View style={s.tabs}>
            {(Object.keys(LABELS) as Mode[]).map((m) => (
            <Pressable key={m} onPress={() => switchMode(m)} style={[s.tab, mode === m && s.tabOn]}>
                <Text style={[s.tabText, mode === m && { color: colors.text }]}>{LABELS[m]}</Text>
            </Pressable>
            ))}
        </View>

        {/* ring */}
        <View style={{ width: SIZE, height: SIZE, marginVertical: 28 }}>
            <Svg width={SIZE} height={SIZE}>
                <Circle cx={SIZE / 2} cy={SIZE / 2} r={R - STROKE} fill={colors.highlight} opacity={0.45} />
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.muted} strokeWidth={STROKE} fill="none" />
            <Circle
                cx={SIZE / 2} cy={SIZE / 2} r={R}
                stroke={colors.primary} strokeWidth={STROKE} fill="none" strokeLinecap="round"
                strokeDasharray={`${CIRC} ${CIRC}`}
                strokeDashoffset={CIRC * (1 - fraction)}
                rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}
            />
            </Svg>
            <View style={s.center}>
            <Text style={s.time}>{fmt(remaining)}</Text>
            <Text style={s.caption}>{mode === 'focus' ? 'Focus on your goal!' : 'Take it easy'}</Text>
            </View>
        </View>

        {/* subject picker (focus only) */}
        {mode === 'focus' && (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ alignSelf: 'stretch', marginBottom: 22, flexGrow: 0 }}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
            >
                {subjects.map((sub) => {
                const on = sub.id === subjectId;
                return (
                    <Pressable
                    key={sub.id}
                    disabled={running}
                    onPress={() => setSubjectId(on ? undefined : sub.id)}
                    style={[s.chip, { backgroundColor: on ? sub.color : colors.surface, borderColor: on ? sub.color : colors.muted }]}
                    >
                    <Text style={s.chipText}>{sub.name}</Text>
                    </Pressable>
                );
                })}
            </ScrollView>
            )}

        {/* controls */}
        <Pressable onPress={running ? pause : start} style={s.main}>
            <Text style={s.mainText}>{running ? 'Pause' : remaining < total ? 'Resume' : 'Start'}</Text>
        </Pressable>
        <Pressable onPress={reset} hitSlop={10} style={{ padding: 12 }}>
            <Text style={s.reset}>Reset</Text>
        </Pressable>

        {/* today */}
        <View style={s.row}>
            <View style={[s.stat, { backgroundColor: colors.muted }]}>
            <Text style={s.statLabel}>Sessions today</Text>
            <Text style={s.statNum}>{todays.length}</Text>
            </View>
            <View style={[s.stat, { backgroundColor: colors.highlight }]}>
            <Text style={s.statLabel}>Focused today</Text>
            <Text style={s.statNum}>{formatMinutes(todayMinutes)}</Text>
            </View>
        </View>
        </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  title: { fontFamily: fonts.heavy, fontSize: 26, color: colors.text, marginTop: 12, alignSelf: 'flex-start' },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.pill, padding: 4,
    marginTop: 16, alignSelf: 'stretch',
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  tabOn: { backgroundColor: colors.surface },
  tabText: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted },
  center: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    },
  time: { fontFamily: fonts.heavy, fontSize: 54, color: colors.text },
  caption: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 22 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5 },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  main: {
    backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 16,
    alignSelf: 'stretch', alignItems: 'center',
  },
  mainText: { fontFamily: fonts.heavy, fontSize: 17, color: colors.text },
  reset: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch', marginTop: 12 },
  stat: { flex: 1, borderRadius: 20, padding: 14 },
  statLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted },
  statNum: { fontFamily: fonts.heavy, fontSize: 22, color: colors.text, marginTop: 2 },
});
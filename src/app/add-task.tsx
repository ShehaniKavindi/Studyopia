import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '../theme';
import { storage, Subject } from '../lib/storage';
import { toKey, addDays, fromKey, DAY_NAMES } from '../lib/dates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddTask() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const editing = !!id;

  const insets = useSafeAreaInsets();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string | undefined>();
  const [dateKey, setDateKey] = useState(date ?? toKey(new Date()));
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setSubjects(await storage.seedSubjects());
      if (id) {
        const t = (await storage.getTasks()).find((x) => x.id === id);
        if (t) {
          setTitle(t.title); setSubjectId(t.subjectId); setDateKey(t.date);
          setTime(t.time ?? ''); setNotes(t.notes ?? '');
        }
      }
    })();
  }, [id]);

  // next 14 days (+ the task's own date if it's outside that range)
  const today = new Date();
  const keys = Array.from({ length: 14 }, (_, i) => toKey(addDays(today, i)));
  if (!keys.includes(dateKey)) keys.unshift(dateKey);

  const save = async () => {
    if (!title.trim()) return setError('Give ur task a title');
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return setError('Time must look like 14:30');
    const data = {
      title: title.trim(), subjectId, date: dateKey,
      time: time || undefined, notes: notes.trim() || undefined,
    };
    if (editing) await storage.updateTask(id!, data);
    else await storage.addTask(data);
    router.back();
  };

  const remove = async () => {
    await storage.deleteTask(id!);
    router.back();
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled">
      <View style={s.top}>
        <Text style={s.heading}>{editing ? 'Edit task' : 'New task'}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={s.close}>Close</Text>
        </Pressable>
      </View>

      <Text style={s.label}>Title</Text>
      <TextInput value={title} onChangeText={(v) => { setTitle(v); setError(''); }}
        placeholder="e.g. Revise Chapter 4" placeholderTextColor={colors.textMuted} style={s.input} />

      <Text style={s.label}>Subject</Text>
      <View style={s.wrap}>
        {subjects.map((sub) => {
          const on = sub.id === subjectId;
          return (
            <Pressable key={sub.id} onPress={() => setSubjectId(on ? undefined : sub.id)}
              style={[s.chip, { backgroundColor: on ? sub.color : colors.surface, borderColor: on ? sub.color : colors.muted }]}>
              <Text style={s.chipText}>{sub.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={s.label}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {keys.map((k) => {
          const d = fromKey(k);
          const on = k === dateKey;
          return (
            <Pressable key={k} onPress={() => setDateKey(k)}
              style={[s.date, on && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}>
              <Text style={s.dateName}>{DAY_NAMES[(d.getDay() + 6) % 7]}</Text>
              <Text style={s.dateNum}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={s.label}>Time (optional)</Text>
      <TextInput value={time} onChangeText={(v) => { setTime(v); setError(''); }} placeholder="14:30"
        placeholderTextColor={colors.textMuted} keyboardType="numbers-and-punctuation" maxLength={5} style={s.input} />

      <Text style={s.label}>Notes (optional)</Text>
      <TextInput value={notes} onChangeText={setNotes} placeholder="Anything to remember"
        placeholderTextColor={colors.textMuted} multiline style={[s.input, { height: 90, textAlignVertical: 'top' }]} />

      {!!error && <Text style={s.error}>{error}</Text>}

      <Pressable onPress={save} style={s.save}>
        <Text style={s.saveText}>{editing ? 'Save changes' : 'Add task'}</Text>
      </Pressable>
      {editing && (
        <Pressable onPress={remove} style={s.delete}>
          <Text style={s.deleteText}>Delete task</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  heading: { fontFamily: fonts.heavy, fontSize: 24, color: colors.text },
  close: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  label: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted, marginTop: 18, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.muted, borderRadius: radius.md,
    padding: 14, fontFamily: fonts.bold, fontSize: 15, color: colors.text,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5 },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  date: {
    width: 48, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md,
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.muted,
  },
  dateName: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted },
  dateNum: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  error: { fontFamily: fonts.bold, color: '#B3425A', marginTop: 14 },
  save: { backgroundColor: colors.primary, borderRadius: radius.pill, padding: 16, alignItems: 'center', marginTop: 24 },
  saveText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  delete: { padding: 16, alignItems: 'center' },
  deleteText: { fontFamily: fonts.bold, fontSize: 14, color: '#B3425A' },
});
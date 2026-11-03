import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius, shadow } from '../theme';
import { storage, Subject } from '../lib/storage';
import { toKey, addDays, fromKey, DAY_NAMES } from '../lib/dates';
import Screen from '../components/Screen';
import Tap from '../components/Tap';
import SubjectIcon from '../components/SubjectIcon';

export default function AddTask() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const editing = !!id;

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
    if (!title.trim()) return setError('Give your task a title');
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
    <Screen>
      <View style={s.top}>
        <Text style={s.heading}>{editing ? 'Edit task' : 'New task'}</Text>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.closeBtn}>
          <Text style={s.close}>Close</Text>
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={(v) => { setTitle(v); setError(''); }}
          placeholder="e.g. Revise Chapter 4"
          placeholderTextColor={colors.textMuted}
          style={s.input}
        />

        <Text style={s.label}>Subject</Text>
        <View style={s.wrap}>
          {subjects.map((sub) => {
            const on = sub.id === subjectId;
            return (
              <Pressable
                key={sub.id}
                onPress={() => setSubjectId(on ? undefined : sub.id)}
                style={[s.chip, on && { backgroundColor: sub.color }]}
              >
                <SubjectIcon subject={sub} size={24} />
                <Text style={s.chipText}>{sub.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.label}>Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 8, paddingHorizontal: 2 }}
          style={{ flexGrow: 0 }}
        >
          {keys.map((k) => {
            const d = fromKey(k);
            const on = k === dateKey;
            return (
              <Pressable key={k} onPress={() => setDateKey(k)} style={[s.date, on && { backgroundColor: colors.secondary }]}>
                <Text style={s.dateName}>{DAY_NAMES[(d.getDay() + 6) % 7]}</Text>
                <Text style={s.dateNum}>{d.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={s.label}>Time (optional)</Text>
        <TextInput
          value={time}
          onChangeText={(v) => { setTime(v); setError(''); }}
          placeholder="14:30"
          placeholderTextColor={colors.textMuted}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          style={s.input}
        />

        <Text style={s.label}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything to remember"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[s.input, { height: 90, textAlignVertical: 'top' }]}
        />

        {!!error && <Text style={s.error}>{error}</Text>}

        <View style={{ marginTop: 26 }}>
          <Tap onPress={save} style={s.save}>
            <Text style={s.saveText}>{editing ? 'Save changes' : 'Add task'}</Text>
          </Tap>
        </View>
        {editing && (
          <Pressable onPress={remove} style={s.delete}>
            <Text style={s.deleteText}>Delete task</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
  },
  heading: { fontFamily: fonts.heavy, fontSize: 26, color: colors.text },
  closeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, ...shadow.soft },
  close: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted },
  label: { fontFamily: fonts.heavy, fontSize: 13, color: colors.textMuted, marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: colors.muted, borderRadius: radius.md, padding: 14,
    fontFamily: fonts.bold, fontSize: 15, color: colors.text,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingLeft: 6, paddingRight: 14, paddingVertical: 6, borderRadius: radius.pill,
    backgroundColor: colors.surface, ...shadow.soft,
  },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  date: {
    width: 50, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md,
    backgroundColor: colors.surface, ...shadow.soft,
  },
  dateName: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted },
  dateNum: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  error: { fontFamily: fonts.bold, color: '#B3425A', marginTop: 14 },
  save: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 17, alignItems: 'center', ...shadow.soft },
  saveText: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text },
  delete: { padding: 16, alignItems: 'center', marginTop: 4 },
  deleteText: { fontFamily: fonts.bold, fontSize: 14, color: '#B3425A' },
});
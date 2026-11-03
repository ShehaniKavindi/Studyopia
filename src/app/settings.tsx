import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Share, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow } from '../theme';
import { storage, Subject, Settings, DEFAULT_SETTINGS } from '../lib/storage';
import ColorPicker from '../components/ColorPicker';
import Avatar from '../components/Avatar';
import Screen from '../components/Screen';
import SubjectIcon from '../components/SubjectIcon';
import { pickAvatar } from '../lib/avatar';
import { ICONS, suggestIcon, IconName } from '../lib/subjectIcons';

const SWATCHES = ['#C3B3D4', '#DACADD', '#FAEECD', '#CFE3DA', '#F4D6E0', '#CFE0F5'];

const TIMERS: { key: keyof Settings; label: string; min: number; max: number }[] = [
  { key: 'focus', label: 'Focus', min: 1, max: 120 },
  { key: 'short', label: 'Short break', min: 1, max: 30 },
  { key: 'long', label: 'Long break', min: 5, max: 60 },
];

export default function SettingsScreen() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [timers, setTimers] = useState<Settings>(DEFAULT_SETTINGS);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(SWATCHES[0]);
  const [icon, setIcon] = useState<IconName>('book-outline');
  const [iconTouched, setIconTouched] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const isCustom = !SWATCHES.includes(newColor);

  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setName((await storage.getName()) ?? '');
        setAvatar(await storage.getAvatar());
        setTimers(await storage.getSettings());
        setSubjects(await storage.seedSubjects());
      })();
    }, [])
  );

  const changePhoto = async () => {
    const uri = await pickAvatar();
    if (!uri) return;
    await storage.setAvatar(uri);
    setAvatar(uri);
  };

  const removePhoto = async () => {
    await storage.removeAvatar();
    setAvatar(null);
  };

  const saveName = async () => {
    if (!name.trim()) return;
    await storage.setName(name.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const bump = async (key: keyof Settings, delta: number, min: number, max: number) => {
    const next = { ...timers, [key]: Math.min(max, Math.max(min, timers[key] + delta)) };
    setTimers(next);
    await storage.setSettings(next);
  };

  const addSubject = async () => {
    if (!newName.trim()) return;
    await storage.addSubject({ name: newName.trim(), color: newColor, icon });
    setNewName('');
    setIcon('book-outline');
    setIconTouched(false);
    setSubjects(await storage.getSubjects());
  };

  const removeSubject = (sub: Subject) =>
    Alert.alert('Delete subject?', `${sub.name} will be removed. Old tasks and sessions stay, but show "No subject".`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await storage.deleteSubject(sub.id);
          setSubjects(await storage.getSubjects());
        },
      },
    ]);

  const exportData = async () => {
    await Share.share({ message: await storage.exportAll() });
  };

  const runImport = () =>
    Alert.alert('Replace all data?', 'This overwrites everything in the app with the backup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Import',
        style: 'destructive',
        onPress: async () => {
          try {
            await storage.importAll(importText.trim());
            setImportText('');
            setShowImport(false);
            setName((await storage.getName()) ?? '');
            setAvatar(await storage.getAvatar());
            setTimers(await storage.getSettings());
            setSubjects(await storage.getSubjects());
            Alert.alert('Done', 'Backup imported.');
          } catch {
            Alert.alert('Could not import', 'That text is not a valid Studyopia backup.');
          }
        },
      },
    ]);

  return (
    <Screen>
      {/* fixed header */}
      <View style={s.top}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.back}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={s.title}>Settings</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* profile */}
        <Text style={s.section}>Profile</Text>
        <View style={s.card}>
          <View style={s.avatarRow}>
            <Pressable onPress={changePhoto}>
              <Avatar uri={avatar} name={name} size={84} />
              <View style={s.camera}>
                <Ionicons name="camera-outline" size={16} color={colors.text} />
              </View>
            </Pressable>
            <View style={{ flex: 1, gap: 8 }}>
              <Pressable onPress={changePhoto} style={[s.btn, { marginTop: 0 }]}>
                <Text style={s.btnText}>{avatar ? 'Change photo' : 'Choose photo'}</Text>
              </Pressable>
              {avatar && (
                <Pressable onPress={removePhoto} hitSlop={8} style={{ alignItems: 'center' }}>
                  <Text style={s.removeText}>Remove photo</Text>
                </Pressable>
              )}
            </View>
          </View>

          <Text style={s.label}>Your name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.textMuted}
            style={s.input}
          />
          <Pressable onPress={saveName} style={s.btn}>
            <Text style={s.btnText}>{saved ? 'Saved' : 'Save name'}</Text>
          </Pressable>
        </View>

        {/* timers */}
        <Text style={s.section}>Timer (minutes)</Text>
        <View style={s.card}>
          {TIMERS.map((t, i) => (
            <View key={t.key} style={[s.timerRow, i > 0 && s.divider]}>
              <Text style={s.timerLabel}>{t.label}</Text>
              <View style={s.stepper}>
                <Pressable onPress={() => bump(t.key, -1, t.min, t.max)} style={s.step} hitSlop={6}>
                  <Ionicons name="remove" size={18} color={colors.text} />
                </Pressable>
                <Text style={s.stepValue}>{timers[t.key]}</Text>
                <Pressable onPress={() => bump(t.key, 1, t.min, t.max)} style={s.step} hitSlop={6}>
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* subjects */}
        <Text style={s.section}>Subjects</Text>
        <View style={s.card}>
          {subjects.map((sub, i) => (
            <View key={sub.id} style={[s.subjectRow, i > 0 && s.divider]}>
              <SubjectIcon subject={sub} size={34} />
              <Text style={s.subjectName}>{sub.name}</Text>
              <Pressable onPress={() => removeSubject(sub)} hitSlop={10}>
                <Ionicons name="trash-outline" size={19} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}

          <View style={[s.divider, { marginTop: 6, paddingTop: 14 }]}>
            <Text style={s.label}>Add subject</Text>
            <TextInput
              value={newName}
              onChangeText={(v) => {
                setNewName(v);
                if (!iconTouched) setIcon(suggestIcon(v));
              }}
              placeholder="e.g. Chemistry"
              placeholderTextColor={colors.textMuted}
              style={s.input}
            />

            {/* icon */}
            <Text style={[s.label, { marginTop: 14 }]}>
              Icon{!iconTouched && newName.trim() ? ' (suggested)' : ''}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              style={{ flexGrow: 0 }}
            >
              {ICONS.map((ic) => {
                const on = ic === icon;
                return (
                  <Pressable
                    key={ic}
                    onPress={() => { setIcon(ic); setIconTouched(true); }}
                    style={[s.iconBtn, on && { backgroundColor: newColor, borderColor: colors.text }]}
                  >
                    <Ionicons name={ic} size={20} color={colors.text} />
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* color */}
            <Text style={[s.label, { marginTop: 14, marginBottom: 0 }]}>Color</Text>
            <View style={s.swatches}>
              {SWATCHES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => { setNewColor(c); setShowPicker(false); }}
                  style={[s.swatch, { backgroundColor: c }, newColor === c && s.swatchOn]}
                />
              ))}
              {/* + custom color */}
              <Pressable
                onPress={() => setShowPicker(!showPicker)}
                style={[
                  s.swatch,
                  s.plus,
                  isCustom && { backgroundColor: newColor, borderStyle: 'solid', borderColor: colors.text },
                ]}
              >
                <Ionicons name={showPicker ? 'chevron-up' : 'add'} size={18} color={colors.text} />
              </Pressable>
            </View>
            {showPicker && <ColorPicker value={newColor} onChange={setNewColor} />}

            <Pressable onPress={addSubject} style={s.btn}>
              <Text style={s.btnText}>Add subject</Text>
            </Pressable>
          </View>
        </View>

        {/* backup */}
        <Text style={s.section}>Backup</Text>
        <View style={s.card}>
          <Text style={s.note}>
            Your data lives only on this phone. Export a copy now and then (send it to yourself).
          </Text>
          <Pressable onPress={exportData} style={s.btn}>
            <Text style={s.btnText}>Export data</Text>
          </Pressable>
          <Pressable onPress={() => setShowImport(!showImport)} style={[s.btn, s.btnLight]}>
            <Text style={s.btnText}>Import data</Text>
          </Pressable>

          {showImport && (
            <View style={{ marginTop: 12 }}>
              <Text style={s.label}>Paste your backup text</Text>
              <TextInput
                value={importText}
                onChangeText={setImportText}
                multiline
                placeholder='{"app":"studyopia", ...}'
                placeholderTextColor={colors.textMuted}
                style={[s.input, { height: 120, textAlignVertical: 'top' }]}
              />
              <Pressable
                onPress={runImport}
                style={[s.btn, !importText.trim() && { opacity: 0.5 }]}
                disabled={!importText.trim()}
              >
                <Text style={s.btnText}>Replace my data</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  back: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', ...shadow.soft,
  },
  title: { fontFamily: fonts.heavy, fontSize: 26, color: colors.text },

  section: { fontFamily: fonts.heavy, fontSize: 16, color: colors.text, marginTop: 24, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, ...shadow.soft },
  label: { fontFamily: fonts.heavy, fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  note: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginBottom: 12, lineHeight: 19 },
  input: {
    backgroundColor: colors.muted, borderRadius: radius.md,
    padding: 12, fontFamily: fonts.bold, fontSize: 15, color: colors.text,
  },
  btn: { backgroundColor: colors.primary, borderRadius: radius.pill, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  btnLight: { backgroundColor: colors.secondary },
  btnText: { fontFamily: fonts.heavy, fontSize: 14, color: colors.text },
  divider: { borderTopWidth: 1, borderTopColor: colors.muted },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 18 },
  camera: {
    position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  removeText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },

  timerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  timerLabel: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  step: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: fonts.heavy, fontSize: 17, color: colors.text, minWidth: 30, textAlign: 'center' },

  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  subjectName: { flex: 1, fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  iconBtn: {
    width: 42, height: 42, borderRadius: 14, borderWidth: 2, borderColor: 'transparent',
    backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center',
  },
  swatches: { flexDirection: 'row', gap: 10, marginTop: 10 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: colors.text },
  plus: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.textMuted,
  },
});
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Subject = { id: string; name: string; color: string; icon?: string };

export type Task = {
  id: string; title: string; subjectId?: string;
  date: string;          // 'YYYY-MM-DD'
  time?: string;         // 'HH:mm'
  notes?: string; done: boolean;
};
export type Session = {
  id: string; subjectId?: string; taskId?: string;
  minutes: number; startedAt: string; // ISO
};



async function read<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
const write = (key: string, value: unknown) =>
  AsyncStorage.setItem(key, JSON.stringify(value));

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export type Settings = { focus: number; short: number; long: number }; // minutes
export const DEFAULT_SETTINGS: Settings = { focus: 25, short: 5, long: 15 };

export const storage = {

    getSettings: async () => ({
        ...DEFAULT_SETTINGS,
        ...(await read<Partial<Settings>>('settings', {})),
    }),
    setSettings: (s: Settings) => write('settings', s),

      getAvatar: () => AsyncStorage.getItem('avatar'),
  setAvatar: (uri: string) => AsyncStorage.setItem('avatar', uri),
  removeAvatar: () => AsyncStorage.removeItem('avatar'),
    
  // name
  getName: () => AsyncStorage.getItem('userName'),
  setName: (n: string) => AsyncStorage.setItem('userName', n),

  // tasks
  getTasks: () => read<Task[]>('tasks', []),
  async addTask(t: Omit<Task, 'id' | 'done'>) {
    const all = await storage.getTasks();
    const task: Task = { ...t, id: uid(), done: false };
    await write('tasks', [...all, task]);
    return task;
  },
  async updateTask(id: string, patch: Partial<Task>) {
    const all = await storage.getTasks();
    await write('tasks', all.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  },
  async deleteTask(id: string) {
    const all = await storage.getTasks();
    await write('tasks', all.filter((t) => t.id !== id));
  },

  // sessions
  getSessions: () => read<Session[]>('sessions', []),
  async addSession(s: Omit<Session, 'id'>) {
    const all = await storage.getSessions();
    await write('sessions', [...all, { ...s, id: uid() }]);
  },

  // subjects
  getSubjects: () => read<Subject[]>('subjects', []),
  async addSubject(s: Omit<Subject, 'id'>) {
    const all = await storage.getSubjects();
    await write('subjects', [...all, { ...s, id: uid() }]);
  },

    async seedSubjects() {
    const all = await storage.getSubjects();
    if (all.length) return all;
    const defaults = [
      { name: 'Math', color: '#C3B3D4' },
      { name: 'Biology', color: '#CFE3DA' },
      { name: 'History', color: '#FAEECD' },
      { name: 'Physics', color: '#DACADD' },
      { name: 'English', color: '#F4D6E0' },
    ];
    await write('subjects', defaults.map((s) => ({ ...s, id: uid() })));
    return storage.getSubjects();
  },

    async deleteSubject(id: string) {
    const all = await storage.getSubjects();
    await write('subjects', all.filter((x) => x.id !== id));
  },

  async exportAll() {
    return JSON.stringify(
      {
        app: 'studyopia',
        version: 1,
        userName: await storage.getName(),
        avatar: await storage.getAvatar(),
        subjects: await storage.getSubjects(),
        tasks: await storage.getTasks(),
        sessions: await storage.getSessions(),
        settings: await storage.getSettings(),
      },
      null,
      2
    );
  },

  async importAll(json: string) {
    const d = JSON.parse(json);
    if (d?.app !== 'studyopia' || !Array.isArray(d.tasks) || !Array.isArray(d.sessions) || !Array.isArray(d.subjects)) {
      throw new Error('Not a Studyopia backup');
    }
    await AsyncStorage.multiSet([
      ['userName', d.userName ?? ''],
      ['avatar', d.avatar ?? ''],
      ['subjects', JSON.stringify(d.subjects)],
      ['tasks', JSON.stringify(d.tasks)],
      ['sessions', JSON.stringify(d.sessions)],
      ['settings', JSON.stringify({ ...DEFAULT_SETTINGS, ...(d.settings ?? {}) })],
    ]);
  },
};
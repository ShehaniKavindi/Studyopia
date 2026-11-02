# Studyopia

A dreamy pastel study companion: plan your tasks, focus with a Pomodoro timer, and track your progress. Built with React Native and Expo.

No account, no backend. Everything is stored on your device.

<!-- Add screenshots here, e.g.
<p>
  <img src="docs/home.png" width="200" />
  <img src="docs/planner.png" width="200" />
  <img src="docs/focus.png" width="200" />
  <img src="docs/progress.png" width="200" />
</p>
-->

## Features

- **Onboarding**: enter your name once, then jump straight in
- **Home**: daily goal progress, study streak, focus time today, and today's schedule
- **Planner**: week strip, task list, check off tasks, add / edit / delete tasks with subject, date, time and notes
- **Focus timer**: Pomodoro, short break and long break with a circular countdown and subject picker
- **Session complete**: a popup after each finished focus session, with a quick jump to a break
- **Progress**: weekly and monthly study-time bars, tasks completed, focus sessions, and time per subject
- **Settings**: change your name, timer lengths and subjects, plus export / import backup

## Tech stack

- [Expo](https://expo.dev) (SDK 58) with [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing)
- React Native + TypeScript
- `@react-native-async-storage/async-storage` for local data
- `react-native-svg` for the timer ring
- `@expo/vector-icons` for icons
- `@expo-google-fonts/nunito` for typography


## Project structure

```
src/
├── app/
│   ├── _layout.tsx            Root stack (fonts, modals)
│   ├── index.tsx              Gate: saved name? Home : Onboarding
│   ├── onboarding.tsx
│   ├── settings.tsx
│   ├── add-task.tsx           Modal: add / edit / delete a task
│   ├── session-complete.tsx   Modal: shown after a focus session
│   └── (tabs)/
│       ├── _layout.tsx        Floating tab bar with centre "+" button
│       ├── home.tsx
│       ├── planner.tsx
│       ├── focus.tsx
│       └── progress.tsx
├── lib/
│   ├── storage.ts             All data reads / writes (AsyncStorage)
│   ├── dates.ts               Date helpers (local YYYY-MM-DD keys)
│   └── stats.ts               Streak and minutes helpers
└── theme.ts                   Colours, radii and fonts
```

## How it works

- **Data**: tasks, subjects, sessions and settings live in AsyncStorage behind a single `storage` module (`src/lib/storage.ts`). Screens never touch AsyncStorage directly, so swapping in a backend later only means rewriting that one file.
- **Timer**: the countdown compares timestamps instead of counting ticks, so it stays accurate if the app is backgrounded. Only completed focus sessions are logged.
- **Streak**: consecutive days with at least one completed focus session.
- **Theme**: every colour lives in `src/theme.ts` using role names (`primary`, `secondary`, `muted`, `highlight`). Change the hex values there to re-theme the whole app.

## Backup

Data is stored only on your device. Use **Settings → Export data** to share a JSON backup, and **Import data** to restore it by pasting the text back in.

## Roadmap

- [ ] Notification when the timer ends
- [ ] Native time picker for tasks
- [ ] Achievements and badges
- [ ] Dark mode / theme switcher
- [ ] File-based backup (export to / import from a `.json` file)
- [ ] Standalone Android build with EAS

## License

Choose a license, e.g. MIT, and add a `LICENSE` file.

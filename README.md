<div align="center">

# Studyopia

### A dreamy pastel study companion

Plan your tasks, focus with a Pomodoro timer, and watch your progress grow.<br>
No account. No backend. Everything stays on your phone.

<br>

![Expo](https://img.shields.io/badge/Expo-SDK_58-C3B3D4?style=for-the-badge&logo=expo&logoColor=2B2540)
![React Native](https://img.shields.io/badge/React_Native-TypeScript-DACADD?style=for-the-badge&logo=react&logoColor=2B2540)
![Expo Router](https://img.shields.io/badge/Expo_Router-file--based-FAEECD?style=for-the-badge&logoColor=2B2540&labelColor=FAEECD&color=FAEECD)
![Offline](https://img.shields.io/badge/Offline-first-EDE8ED?style=for-the-badge&labelColor=EDE8ED&color=EDE8ED)

</div>

<br>

<!-- Add screenshots here once you have them:
<p align="center">
  <img src="docs/home.png" width="190" />
  <img src="docs/planner.png" width="190" />
  <img src="docs/focus.png" width="190" />
  <img src="docs/progress.png" width="190" />
</p>
-->

## Features

| | |
|---|---|
| **Home** | Daily goal with an animated progress bar, study streak, focus time today, and today's schedule |
| **Planner** | Week strip with task dots, a quick "Today" jump, check off tasks, and add / edit / delete tasks with subject, date, time and notes |
| **Focus timer** | Pomodoro, short break and long break with a circular countdown, subject picker and haptic feedback |
| **Session complete** | A friendly popup after every finished session, with a one-tap jump to a break |
| **Progress** | Weekly and monthly study-time bars, tasks completed, focus sessions, and time per subject |
| **Subjects** | Pick from 6 pastel colours or create your own with the built-in colour picker, plus icons that are auto-suggested from the subject name |
| **Profile** | Choose a photo from your gallery as your avatar |
| **Settings** | Name, timer lengths, subjects, and export / import backup |

<br>

## Tech stack

| | |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 58) with [Expo Router](https://docs.expo.dev/router/introduction/) |
| Language | React Native + TypeScript |
| Storage | `@react-native-async-storage/async-storage` |
| Graphics | `react-native-svg` (timer ring), `@expo/vector-icons` |
| Media | `expo-image-picker`, `expo-image-manipulator` (avatar) |
| Feel | `expo-haptics`, `react-native-safe-area-context` |
| Typography | `@expo-google-fonts/nunito` |

<br>

## Getting started

**Prerequisites:** [Node.js](https://nodejs.org) (LTS) and the **Expo Go** app on your phone, or an Android / iOS emulator.

```bash
git clone https://github.com/ShehaniKavindi/Studyopia.git
cd Studyopia
npm install
npx expo start
```

Scan the QR code with Expo Go. If anything looks stale, restart with a clean cache:

```bash
npx expo start -c
```

<br>

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
├── components/
│   ├── Screen.tsx             Safe-area wrapper (solid status bar)
│   ├── Card.tsx               Shadowed surface
│   ├── Tap.tsx                Press-scale + haptic button
│   ├── Bar.tsx                Animated progress bar
│   ├── Avatar.tsx             Photo or initial
│   ├── SubjectIcon.tsx        Coloured subject icon tile
│   └── ColorPicker.tsx        Custom colour picker (no dependencies)
├── lib/
│   ├── storage.ts             All data reads / writes (AsyncStorage)
│   ├── dates.ts               Date helpers (local YYYY-MM-DD keys)
│   ├── stats.ts               Streak and minutes helpers
│   ├── avatar.ts              Gallery picker and resize
│   └── subjectIcons.ts        Icon list and name-based suggestions
└── theme.ts                   Colours, radii, shadow and fonts
```

<br>

## How it works

- **Data:** tasks, subjects, sessions and settings live in AsyncStorage behind a single `storage` module. Screens never touch AsyncStorage directly, so adding a backend later only means rewriting that one file.
- **Timer:** the countdown compares timestamps instead of counting ticks, so it stays accurate if the app is backgrounded. Only completed focus sessions are logged.
- **Streak:** consecutive days with at least one completed focus session.
- **Avatar:** the picked photo is cropped square, resized to 300px and stored as a small data URI, so it is included in backups.
- **Theme:** every colour lives in `src/theme.ts` under role names (`primary`, `secondary`, `muted`, `highlight`), so re-theming the app means changing a few hex values.
- **Subject icons:** typing a subject name suggests a matching icon (for example, "Chemistry" gets a flask). You can override it manually.

<br>

## Backup

Your data lives only on your device. Use **Settings → Export data** to share a JSON backup (including your profile photo), and **Import data** to restore it by pasting the text back in.

<br>

## Roadmap

- [x] Planner, focus timer and progress charts
- [x] Custom subject colours and icons
- [x] Profile photo from the gallery
- [x] Polished UI: shadows, animations, haptics
- [ ] Notification when the timer ends
- [ ] Native time picker for tasks
- [ ] Achievements and badges
- [ ] Dark mode / theme switcher
- [ ] File-based backup (export to / import from a `.json` file)
- [ ] Standalone Android build with EAS

<br>

## License

See [LICENSE](LICENSE).

<br>

<div align="center">

Made with care by **Shehani Kavindi**

</div>

import { Session } from './storage';
import { toKey, addDays } from './dates';

export const minutesOn = (sessions: Session[], dayKey: string) =>
  sessions
    .filter((s) => toKey(new Date(s.startedAt)) === dayKey)
    .reduce((sum, s) => sum + s.minutes, 0);

// consecutive days with at least 1 session, ending today
// (if today has none yet, the streak still counts up to yesterday)
export const streak = (sessions: Session[]) => {
  const days = new Set(sessions.map((s) => toKey(new Date(s.startedAt))));
  let d = new Date();
  if (!days.has(toKey(d))) d = addDays(d, -1);
  let n = 0;
  while (days.has(toKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
};

export const formatMinutes = (m: number) =>
  m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
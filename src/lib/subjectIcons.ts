import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const DEFAULT_ICON: IconName = 'book-outline';

export const ICONS: IconName[] = [
  'calculator-outline', 'leaf-outline', 'flask-outline', 'planet-outline', 'hourglass-outline',
  'language-outline', 'book-outline', 'library-outline', 'create-outline', 'globe-outline',
  'map-outline', 'code-slash-outline', 'laptop-outline', 'color-palette-outline', 'brush-outline',
  'musical-notes-outline', 'barbell-outline', 'football-outline', 'medkit-outline', 'cash-outline',
  'trending-up-outline', 'scale-outline', 'bulb-outline', 'school-outline', 'heart-outline', 'star-outline',
];

const KEYWORDS: [string[], IconName][] = [
  [['math', 'algebra', 'calcul', 'geometry', 'statistic', 'stats'], 'calculator-outline'],
  [['bio', 'nature', 'environment', 'botany'], 'leaf-outline'],
  [['chem'], 'flask-outline'],
  [['physic', 'astronomy', 'space', 'science'], 'planet-outline'],
  [['history', 'ancient', 'civics'], 'hourglass-outline'],
  [['english', 'language', 'french', 'spanish', 'german', 'sinhala', 'tamil', 'japanese', 'grammar'], 'language-outline'],
  [['literature', 'reading', 'novel', 'poetry'], 'library-outline'],
  [['writing', 'essay'], 'create-outline'],
  [['geo', 'map'], 'map-outline'],
  [['world', 'social', 'global'], 'globe-outline'],
  [['program', 'coding', 'code', 'software', 'web', 'java', 'python', 'database', 'sql'], 'code-slash-outline'],
  [['ict', 'computer', 'it ', 'network'], 'laptop-outline'],
  [['art', 'draw', 'design'], 'color-palette-outline'],
  [['music', 'piano', 'guitar'], 'musical-notes-outline'],
  [['pe ', 'sport', 'fitness', 'gym'], 'barbell-outline'],
  [['health', 'medic', 'nursing', 'anatomy'], 'medkit-outline'],
  [['econ', 'account', 'finance', 'business'], 'cash-outline'],
  [['law', 'legal', 'ethic'], 'scale-outline'],
  [['project', 'management', 'research'], 'bulb-outline'],
];

export function suggestIcon(name: string): IconName {
  const n = ` ${name.toLowerCase().trim()} `;
  for (const [keys, icon] of KEYWORDS) {
    if (keys.some((k) => n.includes(k))) return icon;
  }
  return DEFAULT_ICON;
}
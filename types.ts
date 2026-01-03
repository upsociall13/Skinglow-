
export enum AppView {
  ANALYSIS = 'analysis',
  ROUTINE = 'routine',
  SHOP = 'shop',
  PROFILE = 'profile',
  DIARY = 'diary',
  REMINDERS = 'reminders'
}

export interface RoutineStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  skinType: string;
  concerns: string[];
}

export interface DiaryEntry {
  id: string;
  date: string;
  note: string;
  mood: string;
}

export interface ReminderSettings {
  amEnabled: boolean;
  amTime: string;
  amDays: number[]; // Array of day indices 0-6 (Sun-Sat)
  pmEnabled: boolean;
  pmTime: string;
  pmDays: number[]; // Array of day indices 0-6 (Sun-Sat)
}

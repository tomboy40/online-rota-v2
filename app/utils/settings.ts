import type { DateRangeSettings } from './calendar.server';

const SETTINGS_KEY = 'calendar_settings';

export interface CalendarSettings {
  dateRange: DateRangeSettings;
}

export const DEFAULT_SETTINGS: CalendarSettings = {
  dateRange: { months: 1 }
};

const isClient = typeof window !== 'undefined';

export function getCalendarSettings(): CalendarSettings {
  if (!isClient) return DEFAULT_SETTINGS;
  
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(stored) as CalendarSettings;
    return settings;
  } catch (error) {
    console.error('Error reading calendar settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function saveCalendarSettings(settings: CalendarSettings): void {
  if (!isClient) return;
  
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving calendar settings:', error);
  }
}

export const DATE_RANGE_OPTIONS = [
  { label: '±1 Month', value: 1 },
  { label: '±3 Months', value: 3 },
  { label: '±6 Months', value: 6 },
  { label: '±1 Year', value: 12 }
]; 
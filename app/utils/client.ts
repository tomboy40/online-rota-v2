const LAST_VIEW_KEY = 'last-calendar-view';

export type CalendarView = 'day' | 'week' | 'month';

export function getLastCalendarView(): CalendarView {
  if (typeof window === 'undefined') return 'day';
  return (window.localStorage.getItem(LAST_VIEW_KEY) as CalendarView) || 'day';
}

export function setLastCalendarView(view: CalendarView): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_VIEW_KEY, view);
} 
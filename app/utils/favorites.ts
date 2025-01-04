export interface Calendar {
  id: string;
  name: string;
  icalLink: string;
  icalUrl?: string;
  color?: string;
  isVisible?: boolean;
}

const STORAGE_KEY = 'calendars'; // Single storage key for all calendar data

export function getFavorites(): Calendar[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const calendars = JSON.parse(data);
    if (!Array.isArray(calendars)) return [];

    // Validate each calendar object and set default visibility to true
    return calendars.filter(cal => {
      return (
        cal &&
        typeof cal === 'object' &&
        typeof cal.id === 'string' &&
        typeof cal.name === 'string' &&
        typeof cal.icalLink === 'string' &&
        cal.id.trim() !== '' &&
        cal.name.trim() !== '' &&
        cal.icalLink.trim() !== ''
      );
    }).map(cal => ({
      ...cal,
      isVisible: cal.isVisible ?? true // Default to true if not set
    }));
  } catch (error) {
    console.error('Error reading calendar data:', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

export function addFavorite(calendar: Calendar): void {
  if (typeof window === 'undefined') return;
  try {
    const calendars = getFavorites();
    if (!calendars.some(cal => cal.id === calendar.id)) {
      calendars.push({
        ...calendar,
        isVisible: calendar.isVisible ?? true // Default to true if not set
      });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calendars));
      window.dispatchEvent(new CustomEvent('favoriteChanged', { 
        detail: { type: 'add', calendarId: calendar.id }
      }));
    }
  } catch (error) {
    console.error('Error adding calendar:', error);
  }
}

export function removeFavorite(calendarId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const calendars = getFavorites();
    const updatedCalendars = calendars.filter(cal => cal.id !== calendarId);
    if (updatedCalendars.length !== calendars.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCalendars));
      window.dispatchEvent(new CustomEvent('favoriteChanged', { 
        detail: { type: 'remove', calendarId }
      }));
    }
  } catch (error) {
    console.error('Error removing calendar:', error);
  }
}

export function isFavorite(calendarId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const calendars = getFavorites();
    return calendars.some(cal => cal.id === calendarId);
  } catch (error) {
    console.error('Error checking calendar status:', error);
    return false;
  }
}

export function updateCalendarColor(calendarId: string, color: string) {
  if (typeof window === 'undefined') return;
  
  try {
    const calendars = getFavorites();
    const calendar = calendars.find(cal => cal.id === calendarId);
    
    if (calendar) {
      const updatedCalendars = calendars.map(cal => 
        cal.id === calendarId ? { ...cal, color } : cal
      );
      
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCalendars));

      // Use the correct import path with ~ alias
      import('~/utils/calendar.server').then(({ clearCalendarCache }) => {
        if (calendar.icalLink) {
          clearCalendarCache(calendar.icalLink, calendarId);
        }
      }).catch(error => {
        console.error('Error importing clearCalendarCache:', error);
      });
      
      window.dispatchEvent(new CustomEvent('favoriteChanged', {
        detail: { 
          type: 'colorUpdate', 
          calendarId, 
          color,
          timestamp: Date.now()
        }
      }));
    }
  } catch (error) {
    console.error('Error updating calendar color:', error);
  }
}

export function updateCalendarVisibility(calendarId: string, isVisible: boolean) {
  if (typeof window === 'undefined') return;
  
  try {
    const calendars = getFavorites();
    const updatedCalendars = calendars.map(cal => 
      cal.id === calendarId ? { ...cal, isVisible } : cal
    );
    
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCalendars));
    
    window.dispatchEvent(new CustomEvent('favoriteChanged', {
      detail: { 
        type: 'visibilityUpdate', 
        calendarId, 
        isVisible,
        timestamp: Date.now()
      }
    }));
  } catch (error) {
    console.error('Error updating calendar visibility:', error);
  }
} 
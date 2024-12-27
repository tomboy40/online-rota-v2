export interface Calendar {
  id: string;
  name: string;
  icalLink: string;
}

const FAVORITES_KEY = 'calendar-favorites';

export function getFavorites(): Calendar[] {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = window.localStorage.getItem(FAVORITES_KEY);
    if (!favorites) return [];
    
    const parsedFavorites = JSON.parse(favorites);
    if (!Array.isArray(parsedFavorites)) return [];

    // Validate each calendar object
    return parsedFavorites.filter(cal => {
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
    });
  } catch (error) {
    console.error('Error reading favorites:', error);
    // Clear invalid data
    window.localStorage.removeItem(FAVORITES_KEY);
    return [];
  }
}

export function addFavorite(calendar: Calendar): void {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavorites();
    if (!favorites.some(fav => fav.id === calendar.id)) {
      favorites.push(calendar);
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      window.dispatchEvent(new CustomEvent('favoriteChanged', { 
        detail: { type: 'add', calendarId: calendar.id }
      }));
    }
  } catch (error) {
    console.error('Error adding favorite:', error);
  }
}

export function removeFavorite(calendarId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== calendarId);
    if (updatedFavorites.length !== favorites.length) {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
      window.dispatchEvent(new CustomEvent('favoriteChanged', { 
        detail: { type: 'remove', calendarId }
      }));
    }
  } catch (error) {
    console.error('Error removing favorite:', error);
  }
}

export function isFavorite(calendarId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const favorites = getFavorites();
    return favorites.some(fav => fav.id === calendarId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
} 
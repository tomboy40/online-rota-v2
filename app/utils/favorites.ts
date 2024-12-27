export interface Calendar {
  id: string;
  name: string;
}

const FAVORITES_KEY = 'calendar-favorites';

export function getFavorites(): Calendar[] {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = window.localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error reading favorites:', error);
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
      // Dispatch storage event for other components
      window.dispatchEvent(new Event('storage'));
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
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    // Dispatch storage event for other components
    window.dispatchEvent(new Event('storage'));
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
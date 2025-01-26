import ICAL from 'ical.js';
import { db, schema } from '~/utils/db.server';
import { eq } from 'drizzle-orm';
import type { Calendar } from './favorites';

// Add a server-safe version of getFavorites
function getServerFavorites(): Calendar[] {
  try {
    // In the future, we might want to fetch this from the database
    // For now, return an empty array on the server
    return [];
  } catch (error) {
    console.error('Error getting server favorites:', error);
    return [];
  }
}

// Helper function to get favorites that works on both client and server
function getSafeFavorites(): Calendar[] {
  if (typeof window === 'undefined') {
    return getServerFavorites();
  }
  
  // Dynamic import for client-side only code
  const { getFavorites } = require('./favorites');
  return getFavorites();
}

export interface DateRangeSettings {
  months: number; // number of months before and after current date
}

interface CacheEntry {
  events: CalendarEvent[];
  timestamp: number;
  eventCount: number;
  dateRange: DateRangeSettings;
  lastRefresh: string;
}

const calendarCache = new Map<string, CacheEntry>();

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  calendarId: string;
  recurrenceId?: string;
  color?: string;
}

export async function fetchCalendarEvents(
  icalUrl: string, 
  calendarId: string, 
  dateRange: DateRangeSettings = { months: 1 },
  forceRefresh = false
): Promise<CalendarEvent[]> {
  const cacheKey = `${icalUrl}-${calendarId}`;
  const cachedData = calendarCache.get(cacheKey);
  const cacheAge = cachedData ? Date.now() - cachedData.timestamp : Infinity;
  const CACHE_TTL = 30 * 1000;

  // Use cache if available and fresh
  if (cachedData && !forceRefresh && cacheAge < CACHE_TTL && cachedData.events.length > 0) {
    console.log(`[Calendar Cache] Using fresh cache for ${calendarId}`);
    return cachedData.events;
  }

  console.log(`[Calendar Cache] Fetching fresh data for ${calendarId}`);
  
  try {
    const response = await fetch(icalUrl);
    if (!response.ok) {
      if (cachedData?.events.length > 0) {
        console.log(`[Calendar Cache] Fetch failed, using cached data for ${calendarId}`);
        return cachedData.events;
      }
      throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
    }

    const icalData = await response.text();
    console.log(`[Calendar Cache] Fetched iCal data size: ${(icalData.length / 1024).toFixed(2)}KB`);
    
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    console.log(`[Calendar Cache] Raw event count: ${vevents.length}`);
    
    const events: CalendarEvent[] = [];

    const expandStart = new Date();
    expandStart.setMonth(expandStart.getMonth() - dateRange.months);
    const expandEnd = new Date();
    expandEnd.setMonth(expandEnd.getMonth() + dateRange.months);

    vevents.forEach(vevent => {
      const event = new ICAL.Event(vevent);
      
      if (event.isRecurring()) {
        const iterator = event.iterator();
        let next;
        
        while ((next = iterator.next()) && next.compare(ICAL.Time.fromJSDate(expandEnd)) < 0) {
          if (next.compare(ICAL.Time.fromJSDate(expandStart)) < 0) continue;

          const duration = event.duration;
          const endDate = next.clone();
          endDate.addDuration(duration);

          events.push({
            id: `${event.uid}-${next.toUnixTime()}`,
            title: event.summary,
            description: event.description,
            startTime: next.toJSDate(),
            endTime: endDate.toJSDate(),
            location: event.location,
            calendarId,
            recurrenceId: event.uid
          });
        }
      } else {
        events.push({
          id: event.uid || crypto.randomUUID(),
          title: event.summary,
          description: event.description,
          startTime: event.startDate.toJSDate(),
          endTime: event.endDate.toJSDate(),
          location: event.location,
          calendarId
        });
      }
    });

    // Get current colors from favorites before caching
    const favorites = getSafeFavorites();
    const calendarColors = new Map(favorites.map(cal => [cal.id, cal.color]));
    const visibilityStatus = new Map(favorites.map(cal => [cal.id, cal.isVisible ?? true]));

    const processedEvents = events
      .filter(event => visibilityStatus.get(event.calendarId) !== false)
      .map(event => ({
        ...event,
        color: calendarColors.get(event.calendarId)
      }));

    // Store in cache before returning
    const cacheEntry: CacheEntry = {
      events: processedEvents,
      timestamp: Date.now(),
      eventCount: processedEvents.length,
      dateRange,
      lastRefresh: new Date().toISOString()
    };
    calendarCache.set(cacheKey, cacheEntry);
    
    console.log(`[Calendar Cache] Processed ${processedEvents.length} events for ${calendarId} with ±${dateRange.months} month range`);
    if (processedEvents.length > 1000) {
      console.warn(`[Calendar Cache] Large number of events (${processedEvents.length}) for ${calendarId}. Consider reducing date range.`);
    }

    return processedEvents;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    // If we have cached data, return it as fallback
    if (cachedData?.events.length > 0) {
      console.log(`[Calendar Cache] Error occurred, using cached data for ${calendarId}`);
      return cachedData.events;
    }
    throw error;
  }
}

export function filterEventsByDateRange(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  console.log('Filtering with range:', {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString()
  });

  return events.filter(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // Debug log for each event
    console.log('Checking event:', {
      title: event.title,
      eventStart: eventStart.toISOString(),
      eventEnd: eventEnd.toISOString(),
      isWithinRange: (
        (eventStart >= rangeStart && eventStart < rangeEnd) || // Starts within range
        (eventEnd > rangeStart && eventEnd <= rangeEnd) ||     // Ends within range
        (eventStart <= rangeStart && eventEnd >= rangeEnd)     // Spans the entire range
      )
    });

    return (
      (eventStart >= rangeStart && eventStart < rangeEnd) || // Starts within range
      (eventEnd > rangeStart && eventEnd <= rangeEnd) ||     // Ends within range
      (eventStart <= rangeStart && eventEnd >= rangeEnd)     // Spans the entire range
    );
  });
}

// Add cache cleanup function
export function clearCalendarCache(icalUrl?: string, calendarId?: string) {
  if (icalUrl && calendarId) {
    calendarCache.delete(`${icalUrl}-${calendarId}`);
  } else {
    calendarCache.clear();
  }
}

// Manual refresh function
export async function refreshCalendar(
  icalUrl: string,
  calendarId: string,
  dateRange?: DateRangeSettings
): Promise<CalendarEvent[]> {
  const events = await fetchCalendarEvents(icalUrl, calendarId, dateRange, true);
  
  // The lastRefresh will be set in fetchCalendarEvents when creating the cache entry
  
  return events;
}

// Cache info function
export function getCalendarCacheInfo(): { 
  calendarId: string; 
  eventCount: number; 
  lastUpdated: Date;
  lastRefresh: string;
}[] {
  return Array.from(calendarCache.entries()).map(([key, value]) => ({
    calendarId: key.split('-')[1],
    eventCount: value.eventCount,
    lastUpdated: new Date(value.timestamp),
    lastRefresh: value.lastRefresh
  }));
}

// Update the getCachedEvents function to handle cache info
export function getCachedEvents(calendarId: string, infoOnly?: boolean): CalendarEvent[] | { lastRefresh: string } | null {
  // Find cache entry for this calendar
  const cacheEntry = Array.from(calendarCache.entries())
    .find(([key]) => key.includes(calendarId));
    
  if (!cacheEntry) return null;
  
  // If infoOnly is true, return just the cache info
  if (infoOnly) {
    return {
      lastRefresh: cacheEntry[1].lastRefresh
    };
  }
  
  // Otherwise return the events
  return cacheEntry[1].events;
}

export async function refreshCalendarCache(calendarId: string) {
  try {
    const calendarData = await db.select()
      .from(schema.calendar)
      .where(eq(schema.calendar.id, calendarId))
      .limit(1)
      .then(rows => rows[0]);

    if (!calendarData || !calendarData.icalLink) {
      throw new Error("Calendar not found or invalid icalLink");
    }

    const cacheEntry = Array.from(calendarCache.entries())
      .find(([key]) => key.includes(calendarId));

    const dateRange = cacheEntry 
      ? cacheEntry[1].dateRange 
      : { months: 1 };

    clearCalendarCache(calendarData.icalLink, calendarId);

    const events = await refreshCalendar(
      calendarData.icalLink,
      calendarId,
      dateRange
    );

    const cacheKey = `${calendarData.icalLink}-${calendarId}`;
    const updatedCacheEntry = calendarCache.get(cacheKey);

    return {
      events,
      lastRefresh: updatedCacheEntry?.lastRefresh
    };
  } catch (error) {
    console.error('Error in refreshCalendarCache:', error);
    throw error;
  }
} 
import ICAL from 'ical.js';
import { db, schema } from '~/utils/db.server';
import { eq } from 'drizzle-orm';

export interface DateRangeSettings {
  months: number; // number of months before and after current date
}

interface CacheEntry {
  events: CalendarEvent[];
  timestamp: number;
  eventCount: number;
  dateRange: DateRangeSettings;
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
}

export async function fetchCalendarEvents(
  icalUrl: string, 
  calendarId: string, 
  dateRange: DateRangeSettings = { months: 1 },
  forceRefresh = false
): Promise<CalendarEvent[]> {
  // Check cache first
  const cacheKey = `${icalUrl}-${calendarId}`;
  const cachedData = calendarCache.get(cacheKey);

  // If cache exists and date range matches, use cache
  if (cachedData && !forceRefresh && cachedData.dateRange.months === dateRange.months) {
    console.log(`[Calendar Cache] Hit for ${calendarId}. ${cachedData.eventCount} events from cache.`);
    return cachedData.events;
  }

  try {
    console.log(`[Calendar Cache] ${forceRefresh ? 'Force refresh' : 'Cache miss'} for ${calendarId}`);
    const response = await fetch(icalUrl);
    if (!response.ok) {
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

    // Store in cache before returning
    const cacheEntry: CacheEntry = {
      events,
      timestamp: Date.now(),
      eventCount: events.length,
      dateRange
    };
    calendarCache.set(cacheKey, cacheEntry);
    
    console.log(`[Calendar Cache] Processed ${events.length} events for ${calendarId} with ±${dateRange.months} month range`);
    if (events.length > 1000) {
      console.warn(`[Calendar Cache] Large number of events (${events.length}) for ${calendarId}. Consider reducing date range.`);
    }

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
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
  return fetchCalendarEvents(icalUrl, calendarId, dateRange, true);
}

// Cache info function
export function getCalendarCacheInfo(): { calendarId: string; eventCount: number; lastUpdated: Date }[] {
  return Array.from(calendarCache.entries()).map(([key, value]) => ({
    calendarId: key.split('-')[1],
    eventCount: value.eventCount,
    lastUpdated: new Date(value.timestamp)
  }));
}

// Add a function to get cached events
export function getCachedEvents(calendarId: string): CalendarEvent[] | undefined {
  const cacheEntry = Array.from(calendarCache.entries())
    .find(([key]) => key.includes(calendarId));
  
  return cacheEntry?.[1].events;
}

export async function refreshCalendarCache(calendarId: string) {
  try {
    // Get calendar data from database using the correct query structure
    const calendarData = await db.select()
      .from(schema.calendar)
      .where(eq(schema.calendar.id, calendarId))
      .limit(1)
      .then(rows => rows[0]);

    if (!calendarData || !calendarData.icalLink) {
      throw new Error("Calendar not found or invalid icalLink");
    }

    // Find cache entry for date range settings
    const cacheEntry = Array.from(calendarCache.entries())
      .find(([key]) => key.includes(calendarId));

    // Use cache date range or default
    const dateRange = cacheEntry 
      ? cacheEntry[1].dateRange 
      : { months: 1 };

    // Clear existing cache for this calendar
    clearCalendarCache(calendarData.icalLink, calendarId);

    // Fetch fresh data
    const events = await refreshCalendar(
      calendarData.icalLink,
      calendarId,
      dateRange
    );

    return events;
  } catch (error) {
    console.error('Error in refreshCalendarCache:', error);
    throw error;
  }
} 
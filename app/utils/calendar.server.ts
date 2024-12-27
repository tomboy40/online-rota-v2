import ICAL from 'ical.js';

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

export async function fetchCalendarEvents(icalUrl: string, calendarId: string): Promise<CalendarEvent[]> {
  try {
    const response = await fetch(icalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
    }

    const icalData = await response.text();
    const jcalData = ICAL.parse(icalData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    const events: CalendarEvent[] = [];

    const expandStart = new Date();
    expandStart.setFullYear(expandStart.getFullYear() - 1);
    const expandEnd = new Date();
    expandEnd.setFullYear(expandEnd.getFullYear() + 1);

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

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

export function filterEventsByDateRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  return events.filter(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    return eventStart <= endDate && eventEnd >= startDate;
  });
} 
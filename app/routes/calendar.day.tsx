import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useNavigation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { fetchCalendarEvents, filterEventsByDateRange, type CalendarEvent, getCachedEvents } from "~/utils/calendar.server";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import CurrentTimeIndicator from "~/components/CurrentTimeIndicator";
import { useEffect, useState } from "react";
import * as clientUtils from "~/utils/client";
import LoadingSpinner from "~/components/LoadingSpinner";
import EventDetailsDialog from '~/components/EventDetailsDialog';
import { getFavorites } from "~/utils/favorites";

type ContextType = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedCalendarId?: string;
  visibleCalendars: Set<string>;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const calendarId = url.searchParams.get("calendarId");
  
  if (request.headers.get("Purpose") === "prefetch") {
    return json({ events: [], isLoading: false });
  }

  let events: CalendarEvent[] = [];
  let isLoading = false;

  if (calendarId) {
    isLoading = true;
    // Try to get events from cache first
    const cachedEvents = getCachedEvents(calendarId);
    if (cachedEvents) {
      return json({ events: cachedEvents, isLoading: false });
    }

    const calendar = await db.query.calendar.findFirst({
      where: (calendar, { eq }) => eq(calendar.id, calendarId)
    });

    if (calendar) {
      try {
        events = await fetchCalendarEvents(calendar.icalLink, calendar.id);
      } finally {
        isLoading = false;
      }
    }
  }

  // Get calendar colors from favorites
  const favorites = getFavorites();
  const calendarColors = new Map(
    favorites.map(cal => [cal.id, cal.color || '#3b82f6'])
  );

  // Add color to each event
  const eventsWithColors = events.map(event => ({
    ...event,
    color: calendarColors.get(event.calendarId)
  }));

  return json({ events: eventsWithColors, isLoading });
}

export default function CalendarDay() {
  const { events: initialEvents, isLoading: isDataLoading } = useLoaderData<typeof loader>();
  const { currentDate, visibleCalendars } = useOutletContext<ContextType>();
  const navigation = useNavigation();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState(initialEvents);
  const [favorites, setFavorites] = useState<Calendar[]>([]);

  // Load favorites and their colors
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Listen for color changes
  useEffect(() => {
    const handleFavoriteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === 'colorUpdate') {
        const { calendarId, color } = customEvent.detail;
        setFavorites(getFavorites()); // Update favorites
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.calendarId === calendarId 
              ? { ...event, color } 
              : event
          )
        );
      }
    };

    window.addEventListener('favoriteChanged', handleFavoriteChange);
    return () => window.removeEventListener('favoriteChanged', handleFavoriteChange);
  }, []);

  // Update events when initialEvents changes
  useEffect(() => {
    // Apply current favorite colors to new events
    const favColors = new Map(favorites.map(f => [f.id, f.color]));
    setEvents(initialEvents.map(event => ({
      ...event,
      color: favColors.get(event.calendarId) || event.color
    })));
  }, [initialEvents, favorites]);

  // Update loading condition to only show when fetching new calendar data
  const isLoadingCalendar = navigation.state === "loading" && 
    navigation.location.search !== location.search && // Only when calendar ID changes
    navigation.location.search.includes("calendarId");

  // Store current view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      clientUtils.setLastCalendarView('day');
    }
  }, []);

  // Add debug logging
  console.log('Day View - Raw Events:', events);
  console.log('Day View - Current Date:', currentDate);

  // Parse the events dates and validate them
  const parsedEvents = events
    .map(event => {
      try {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.error('Invalid date in event:', event);
          return null;
        }

        // Use the currentDate from context for day boundaries
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);

        // Check if event overlaps with current day
        if (endTime < dayStart || startTime > dayEnd) {
          return null; // Skip events not in current day
        }
        
        const adjustedStart = new Date(Math.max(startTime.getTime(), dayStart.getTime()));
        const adjustedEnd = new Date(Math.min(endTime.getTime(), dayEnd.getTime()));
        
        return {
          ...event,
          startTime: adjustedStart,
          endTime: adjustedEnd,
          continuesFromPrevDay: startTime < dayStart,
          continuesNextDay: endTime > dayEnd
        };
      } catch (error) {
        console.error('Error parsing event dates:', error, event);
        return null;
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  // Add debug logging for parsed events
  console.log('Day View - Parsed Events:', parsedEvents);

  // Generate time slots (from 12 AM to 11 PM)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    return {
      label: `${hour} ${ampm}`,
      hour: i,
    };
  });

  // Format date for header
  const formatDayHeader = () => {
    const today = new Date();
    const isToday = currentDate.toDateString() === today.toDateString();
    
    return {
      dayName: currentDate.toLocaleString('default', { weekday: 'short' }).toUpperCase(),
      dayNumber: currentDate.getDate(),
      isToday,
    };
  };

  const { dayName, dayNumber, isToday } = formatDayHeader();

  const filterEvents = (events: Array<any>) => {
    return events.filter(event => visibleCalendars.has(event.calendarId));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {isLoadingCalendar && <LoadingSpinner />}
      {/* Header row with day */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {/* Time gutter */}
        <div className="w-16 flex-shrink-0" />
        
        {/* Day column */}
        <div className={`flex-1 text-center py-2 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
          <div className="text-sm font-medium">{dayName}</div>
          <div className={`text-2xl font-medium ${
            isToday ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto' : ''
          }`}>
            {dayNumber}
          </div>
        </div>
      </div>

      {/* Time grid */}
      <div className="flex flex-1 overflow-y-auto">
        {/* Time labels */}
        <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-white sticky left-0">
          {timeSlots.map(({ label, hour }, index) => (
            <div
              key={index}
              className="h-12 text-right pr-2 relative border-b border-gray-100"
            >
              <span className="text-xs text-gray-500 absolute -top-2 right-2">{label}</span>
            </div>
          ))}
          <div className="h-12 border-b border-gray-100" />
        </div>

        {/* Grid column */}
        <div className="flex-1 relative">
          {/* Hour lines */}
          {timeSlots.map((_, index) => (
            <div
              key={index}
              className="h-12 border-b border-gray-100"
            />
          ))}
          <div className="h-12 border-b border-gray-100" />

          {/* Current time indicator */}
          {isToday && <CurrentTimeIndicator />}

          {/* Events */}
          {filterEvents(parsedEvents).map((event) => {
            const dayStart = startOfDay(currentDate);
            const dayEnd = endOfDay(currentDate);
            
            // Convert UTC times to local time without manual timezone offset
            const localStart = new Date(event.startTime);
            const localEnd = new Date(event.endTime);
            
            const eventStart = new Date(Math.max(localStart.getTime(), dayStart.getTime()));
            const eventEnd = new Date(Math.min(localEnd.getTime(), dayEnd.getTime()));
            
            // Calculate position using local hours directly from Date object
            const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
            const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
            
            // Handle events that end at midnight
            const duration = endMinutes === 0 ? 1440 - startMinutes : endMinutes - startMinutes;
            
            // Calculate pixels (each hour is 48px tall)
            const pixelsPerHour = 48;
            const pixelsPerMinute = pixelsPerHour / 60;
            const topPosition = startMinutes * pixelsPerMinute;
            const heightPixels = duration * pixelsPerMinute;

            console.log('Filtering event:', {
              title: event.title,
              eventStart,
              eventEnd,
              dayStart,
              dayEnd
            });

            return (
              <div
                key={event.id}
                className={`absolute left-1 right-1 p-2 overflow-hidden cursor-pointer
                  ${event.continuesFromPrevDay ? '' : 'rounded-t-lg'}
                  ${event.continuesNextDay ? '' : 'rounded-b-lg'}`}
                style={{
                  top: `${topPosition}px`,
                  height: `${heightPixels}px`,
                  minHeight: '20px',
                  backgroundColor: event.color ? `${event.color}20` : '#3b82f620',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderTopWidth: event.continuesFromPrevDay ? '2px' : '1px',
                  borderBottomWidth: event.continuesNextDay ? '2px' : '1px',
                  borderColor: event.color || '#3b82f6'
                }}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="text-sm font-semibold truncate" style={{ color: event.color || '#3b82f6' }}>
                  {event.title}
                  {(event.continuesFromPrevDay || event.continuesNextDay) && ' (...)'}
                </div>
                {heightPixels >= 8 && event.location && (
                  <div className="text-xs truncate" style={{ color: event.color || '#3b82f6' }}>
                    {event.location}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Dialog */}
      <EventDetailsDialog
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
} 
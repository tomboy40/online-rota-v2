import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useNavigation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { fetchCalendarEvents, filterEventsByDateRange, type CalendarEvent, getCachedEvents } from "~/utils/calendar.server";
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import * as clientUtils from "~/utils/client";
import LoadingSpinner from "~/components/LoadingSpinner";
import CurrentTimeIndicator from "~/components/CurrentTimeIndicator";
import EventDetailsDialog from '~/components/EventDetailsDialog';
import { getFavorites } from "~/utils/favorites";
import type { Calendar } from "~/utils/favorites";

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
    // Check cache first
    const cachedEvents = getCachedEvents(calendarId);
    if (cachedEvents) {
      return json({ events: cachedEvents, isLoading: false });
    }

    isLoading = true;
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
  const calendarColors = new Map(favorites.map(cal => [cal.id, cal.color]));

  // Add color to each event
  const eventsWithColors = events.map(event => ({
    ...event,
    color: calendarColors.get(event.calendarId)
  }));

  return json({ events: eventsWithColors, isLoading });
}

export default function CalendarWeek() {
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

  // Get the start and end of the week
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

  // Filter events for the current week
  const weekEvents = events
    .map(event => {
      try {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return null;
        }

        // Check if event overlaps with the week
        if (endTime < startOfDay(weekStart) || startTime > endOfDay(weekEnd)) {
          return null;
        }

        return {
          ...event,
          startTime,
          endTime
        };
      } catch (error) {
        console.error('Error parsing event dates:', error, event);
        return null;
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  // Update loading condition to only show when fetching new calendar data
  const isLoadingCalendar = navigation.state === "loading" && 
    navigation.location.search !== location.search &&
    navigation.location.search.includes("calendarId");

  // Store current view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      clientUtils.setLastCalendarView('week');
    }
  }, []);

  // Generate time slots (from 12 AM to 11 PM)
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    return {
      label: `${hour} ${ampm}`,
      hour: i,
    };
  });

  // Generate week dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - date.getDay() + i);
    return date;
  });

  // Format date for column headers
  const formatColumnHeader = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    return {
      dayName: date.toLocaleString('default', { weekday: 'short' }).toUpperCase(),
      dayNumber: date.getDate(),
      isToday,
    };
  };

  // In your event rendering logic, filter events based on calendar visibility
  const filterEvents = (events: Array<any>) => {
    return events.filter(event => visibleCalendars.has(event.calendarId));
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {isLoadingCalendar && <LoadingSpinner />}
      {/* Header row with days */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {/* Time gutter */}
        <div className="w-16 flex-shrink-0" />
        
        {/* Day columns */}
        {weekDates.map((date, index) => {
          const { dayName, dayNumber, isToday } = formatColumnHeader(date);
          return (
            <div
              key={index}
              className={`flex-1 text-center py-2 ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <div className="text-sm font-medium">{dayName}</div>
              <div className={`text-2xl font-medium ${
                isToday ? 'bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center mx-auto' : ''
              }`}>
                {dayNumber}
              </div>
            </div>
          );
        })}
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

        {/* Grid columns */}
        <div className="flex flex-1">
          {weekDates.map((date, dateIndex) => (
            <div
              key={dateIndex}
              className="flex-1 border-r border-gray-200 relative"
            >
              {/* Hour lines */}
              {timeSlots.map((_, index) => (
                <div
                  key={index}
                  className="h-12 border-b border-gray-100"
                />
              ))}
              <div className="h-12 border-b border-gray-100" />

              {/* Current time indicator */}
              {formatColumnHeader(date).isToday && <CurrentTimeIndicator />}

              {/* Events */}
              {filterEvents(weekEvents)
                .filter(event => {
                  const eventDate = new Date(event.startTime);
                  return eventDate.toDateString() === date.toDateString();
                })
                .map(event => {
                  const startTime = new Date(event.startTime);
                  const endTime = new Date(event.endTime);
                  const dayStart = startOfDay(date);
                  const dayEnd = endOfDay(date);

                  // Adjust times to day boundaries if needed
                  const adjustedStart = new Date(Math.max(startTime.getTime(), dayStart.getTime()));
                  const adjustedEnd = new Date(Math.min(endTime.getTime(), dayEnd.getTime()));

                  // Calculate position using local hours directly from Date object
                  const startMinutes = adjustedStart.getHours() * 60 + adjustedStart.getMinutes();
                  const endMinutes = adjustedEnd.getHours() * 60 + adjustedEnd.getMinutes();
                  const duration = endMinutes === 0 ? 1440 - startMinutes : endMinutes - startMinutes;

                  // Calculate pixels (each hour is 48px tall)
                  const pixelsPerHour = 48;
                  const pixelsPerMinute = pixelsPerHour / 60;
                  const topPosition = startMinutes * pixelsPerMinute;
                  const heightPixels = duration * pixelsPerMinute;

                  return (
                    <div
                      key={event.id}
                      className={`absolute left-1 right-1 p-2 overflow-hidden cursor-pointer
                        ${event.startTime < dayStart ? '' : 'rounded-t-lg'}
                        ${event.endTime > dayEnd ? '' : 'rounded-b-lg'}`}
                      style={{
                        top: `${topPosition}px`,
                        height: `${heightPixels}px`,
                        minHeight: '20px',
                        backgroundColor: event.color ? `${event.color}20` : '#3b82f620',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderTopWidth: event.startTime < dayStart ? '2px' : '1px',
                        borderBottomWidth: event.endTime > dayEnd ? '2px' : '1px',
                        borderColor: event.color || '#3b82f6'
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div 
                        className="text-sm font-semibold truncate" 
                        style={{ color: event.color || '#3b82f6' }}
                      >
                        {event.title}
                        {(event.startTime < dayStart || event.endTime > dayEnd) && ' (...)'}
                      </div>
                      {heightPixels >= 8 && event.location && (
                        <div 
                          className="text-xs truncate" 
                          style={{ color: event.color || '#3b82f6' }}
                        >
                          {event.location}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      <EventDetailsDialog
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
} 
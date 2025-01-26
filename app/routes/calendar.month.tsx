import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useNavigation } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import { db } from "~/utils/db.server";
import { debounce } from "~/utils/helpers";
import { fetchCalendarEvents, filterEventsByDateRange, type CalendarEvent as BaseCalendarEvent, getCachedEvents } from "~/utils/calendar.server";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import * as clientUtils from "~/utils/client";
import LoadingSpinner from "~/components/LoadingSpinner";
import EventDetailsDialog from "~/components/EventDetailsDialog";
import { getFavorites, type Calendar } from "~/utils/favorites";
import { useLoading } from '~/contexts/LoadingContext';

// Extend the base calendar event type
type CalendarEvent = BaseCalendarEvent & {
  isFullDay?: boolean;
};

type ContextType = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedCalendarId?: string;
  visibleCalendars: Set<string>;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const calendarId = url.searchParams.get("calendarId");
  
  let events: CalendarEvent[] = [];
  let isLoading = false;

  if (calendarId) {
    isLoading = true;
    const calendar = await db.query.calendar.findFirst({
      where: (calendar, { eq }) => eq(calendar.id, calendarId)
    });

    if (calendar) {
      try {
        // Try to get cached events first
        const cachedEvents = getCachedEvents(calendarId);
        
        if (Array.isArray(cachedEvents) && cachedEvents.length > 0) {
          events = cachedEvents;
        } else {
          // If no cache or empty cache, fetch fresh data
          events = await fetchCalendarEvents(calendar.icalLink, calendar.id, { months: 1 });
        }
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

  return json({ 
    events: eventsWithColors, 
    isLoading,
    timestamp: Date.now()
  });
}

export default function CalendarMonth() {
  const { events: initialEvents, isLoading: isDataLoading } = useLoaderData<typeof loader>();
  const { currentDate, setCurrentDate, visibleCalendars } = useOutletContext<ContextType>();
  const navigation = useNavigation();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState(initialEvents);
  const [processedEvents, setProcessedEvents] = useState<CalendarEvent[]>([]);
  const [favorites, setFavorites] = useState<Calendar[]>([]);
  const { showLoading, hideLoading } = useLoading();

  // Load favorites and their colors
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Process and deduplicate events when they change
  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const processedMap = new Map<string, CalendarEvent>();

    events.forEach(event => {
      try {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
          // Check if it's a full-day event by checking if the time component is midnight
          const isFullDay = startTime.getHours() === 0 && 
                          startTime.getMinutes() === 0 && 
                          endTime.getHours() === 0 && 
                          endTime.getMinutes() === 0;

          // For full-day events:
          // - Start time should be start of the start day
          // - End time should be start of the end day (exclusive) - 1 millisecond
          const eventStart = isFullDay ? startOfDay(startTime) : startTime;
          const eventEnd = isFullDay 
            ? new Date(startOfDay(endTime).getTime() - 1) // End at 23:59:59.999 of previous day
            : endTime;

          // Create a unique ID that properly handles full-day events
          const uniqueId = isFullDay
            ? `${event.id}_${eventStart.toISOString().split('T')[0]}_fullday`
            : event.recurrenceId 
              ? `${event.id}_${event.recurrenceId}`
              : `${event.id}_${startTime.toISOString()}`;

          // Only process if within month bounds
          if (!processedMap.has(uniqueId) && 
              !(eventEnd < monthStart || eventStart > monthEnd)) {
            processedMap.set(uniqueId, {
              ...event,
              id: uniqueId,
              startTime: eventStart,
              endTime: eventEnd,
              isFullDay
            });
          }
        }
      } catch (error) {
        console.error('Error processing event:', error, event);
      }
    });

    setProcessedEvents(Array.from(processedMap.values()));
  }, [events, currentDate]);

  // Listen for color changes
  useEffect(() => {
    const handleFavoriteChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.type === 'colorUpdate') {
        const { calendarId, color } = customEvent.detail;
        setFavorites(getFavorites());
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
    const favColors = new Map(favorites.map(f => [f.id, f.color]));
    setEvents(initialEvents.map(event => ({
      ...event,
      color: favColors.get(event.calendarId) || event.color
    })));
  }, [initialEvents, favorites]);

  // Filter events for each day
  const getEventsForDate = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return processedEvents
      .map(event => {
        try {
          const startTime = event.startTime;
          const endTime = event.endTime;

          // Check if event overlaps with the day
          if (endTime < dayStart || startTime > dayEnd) {
            return null;
          }

          // For full-day events, use the day boundaries
          const adjustedStart = event.isFullDay ? dayStart : startTime;
          const adjustedEnd = event.isFullDay ? dayEnd : endTime;

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
  };

  // Update loading effect
  useEffect(() => {
    const isLoadingCalendar = 
      isDataLoading || 
      (navigation.state === "loading" && 
       navigation.location?.search !== location.search && 
       navigation.location?.search.includes("calendarId"));

    if (isLoadingCalendar) {
      showLoading('Loading calendar data...');
    } else {
      hideLoading();
    }
  }, [isDataLoading, navigation.state, navigation.location?.search, showLoading, hideLoading]);

  // Store current view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      clientUtils.setLastCalendarView('month');
    }
  }, []);

  // Handle mouse wheel scroll
  const handleWheel = useCallback(
    debounce((event: WheelEvent) => {
      const newDate = new Date(currentDate);
      if (event.deltaY > 0) {
        // Scroll down - next month
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        // Scroll up - previous month
        newDate.setMonth(newDate.getMonth() - 1);
      }
      setCurrentDate(newDate);
    }, 100),
    [currentDate, setCurrentDate]
  );

  useEffect(() => {
    const element = document.getElementById('month-grid');
    if (element) {
      element.addEventListener('wheel', handleWheel);
      return () => element.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Generate dates for the month view
  const generateMonthDates = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Generate array of dates
    const dates: (Date | null)[] = [];
    
    // Add empty slots for days before first of month
    for (let i = 0; i < startingDay; i++) {
      dates.push(null);
    }
    
    // Add all days of month
    for (let i = 1; i <= totalDays; i++) {
      dates.push(new Date(year, month, i));
    }

    // Add empty slots for remaining days to complete the grid
    const remainingSlots = 42 - dates.length; // 6 rows * 7 days = 42
    for (let i = 0; i < remainingSlots; i++) {
      dates.push(null);
    }
    
    return dates;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const filterEvents = (events: Array<any>) => {
    return events.filter(event => visibleCalendars.has(event.calendarId));
  };

  return (
    <div id="month-grid" className="flex flex-col h-full bg-white">
      {/* Month Grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l">
        {/* Day headers */}
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className="border-r border-b p-2 bg-white">
            <span className="text-xs font-medium text-gray-500">{day}</span>
          </div>
        ))}

        {/* Calendar dates */}
        {generateMonthDates().map((date, index) => (
          <div
            key={index}
            className="border-r border-b min-h-[100px] relative"
          >
            {date && (
              <>
                <div className="p-2">
                  <span className={`text-sm inline-flex items-center justify-center ${
                    isToday(date) 
                      ? 'bg-blue-600 text-white w-6 h-6 rounded-full' 
                      : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </span>
                </div>
                {/* Events */}
                <div className="px-2 space-y-1">
                  {filterEvents(getEventsForDate(date)).map(event => (
                    <div
                      key={event.id}
                      className="text-xs px-2 py-1 truncate hover:opacity-80 cursor-pointer rounded"
                      style={{
                        backgroundColor: event.color ? `${event.color}20` : '#3b82f620',
                        color: event.color || '#3b82f6',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: event.color || '#3b82f6'
                      }}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title}
                      {(event.continuesFromPrevDay || event.continuesNextDay) && ' (...)'}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
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
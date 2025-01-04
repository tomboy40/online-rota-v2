import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useNavigation } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import { db } from "~/utils/db.server";
import { debounce } from "~/utils/helpers";
import { fetchCalendarEvents, filterEventsByDateRange, type CalendarEvent } from "~/utils/calendar.server";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import * as clientUtils from "~/utils/client";
import LoadingSpinner from "~/components/LoadingSpinner";
import EventDetailsDialog from "~/components/EventDetailsDialog";
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
  
  // Only check for prefetch requests
  const isPrefetch = request.headers.get("Purpose") === "prefetch";

  if (isPrefetch) {
    return json({ events: [], isLoading: false });
  }

  let events: CalendarEvent[] = [];
  let isLoading = false;

  if (calendarId) {
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

export default function CalendarMonth() {
  const { events: initialEvents, isLoading: isDataLoading } = useLoaderData<typeof loader>();
  const { currentDate, setCurrentDate, visibleCalendars } = useOutletContext<ContextType>();
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

  // Get the start and end of the month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Filter events for each day
  const getEventsForDate = (date: Date) => {
    return events
      .map(event => {
        try {
          const startTime = new Date(event.startTime);
          const endTime = new Date(event.endTime);

          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return null;
          }

          const dayStart = startOfDay(date);
          const dayEnd = endOfDay(date);

          // Check if event overlaps with the day
          if (endTime < dayStart || startTime > dayEnd) {
            return null;
          }

          return {
            ...event,
            startTime,
            endTime,
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

  // Update loading condition to only show when fetching new calendar data
  const isLoadingCalendar = navigation.state === "loading" && 
    navigation.location.search !== location.search &&
    navigation.location.search.includes("calendarId");

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
      {isLoadingCalendar && <LoadingSpinner />}
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
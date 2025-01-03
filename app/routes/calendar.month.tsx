import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useNavigation } from "@remix-run/react";
import { useCallback, useEffect } from "react";
import { db } from "~/utils/db.server";
import { debounce } from "~/utils/helpers";
import { fetchCalendarEvents, filterEventsByDateRange, type CalendarEvent } from "~/utils/calendar.server";
import { startOfMonth, endOfMonth } from "date-fns";
import * as clientUtils from "~/utils/client";
import LoadingSpinner from "~/components/LoadingSpinner";

type ContextType = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  selectedCalendarId?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const calendarId = url.searchParams.get("calendarId");
  const currentDate = dateParam ? new Date(dateParam) : new Date();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Only check for prefetch requests, remove isFromSearch check
  const isPrefetch = request.headers.get("Purpose") === "prefetch";

  // Return minimal data for prefetch requests only
  if (isPrefetch) {
    return json({ currentDate: currentDate.toISOString(), events: [], isLoading: false });
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
        const allEvents = await fetchCalendarEvents(calendar.icalLink, calendar.id);
        events = filterEventsByDateRange(
          allEvents,
          monthStart,
          monthEnd
        );
      } finally {
        isLoading = false;
      }
    }
  }

  return json({ currentDate: currentDate.toISOString(), events, isLoading });
}

export default function CalendarMonth() {
  const { events, isLoading: isDataLoading } = useLoaderData<typeof loader>();
  const { currentDate, setCurrentDate } = useOutletContext<ContextType>();
  const navigation = useNavigation();
  
  // Only show loading when fetching calendar data
  const isLoadingCalendar = navigation.state !== "idle" && 
    (navigation.location?.search?.includes("calendarId") || isDataLoading);

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
                  {events
                    .filter(event => {
                      const eventDate = new Date(event.startTime);
                      return eventDate.toDateString() === date.toDateString();
                    })
                    .map(event => (
                      <div
                        key={event.id}
                        className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1 truncate hover:bg-blue-200 cursor-pointer"
                      >
                        {event.title}
                      </div>
                    ))
                  }
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, useNavigation } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { fetchCalendarEvents, filterEventsByDateRange, type CalendarEvent } from "~/utils/calendar.server";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import CurrentTimeIndicator from "~/components/CurrentTimeIndicator";
import { useEffect } from "react";
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
    const calendar = await db.calendar.findUnique({
      where: { id: calendarId },
    });

    if (calendar) {
      try {
        const allEvents = await fetchCalendarEvents(calendar.icalLink, calendar.id);
        events = filterEventsByDateRange(
          allEvents,
          startOfDay(currentDate),
          endOfDay(currentDate)
        );
      } finally {
        isLoading = false;
      }
    }
  }

  return json({ currentDate: currentDate.toISOString(), events, isLoading });
}

export default function CalendarDay() {
  const { events, currentDate: currentDateStr, isLoading: isDataLoading } = useLoaderData<typeof loader>();
  const { currentDate } = useOutletContext<ContextType>();
  const navigation = useNavigation();
  
  // Only show loading when fetching calendar data
  const isLoadingCalendar = navigation.state !== "idle" && 
    (navigation.location?.search?.includes("calendarId") || isDataLoading);

  // Store current view
  useEffect(() => {
    if (typeof window !== 'undefined') {
      clientUtils.setLastCalendarView('day');
    }
  }, []);

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

        // Adjust start and end times to the current day's boundaries if needed
        const dayStart = startOfDay(currentDate);
        const dayEnd = endOfDay(currentDate);
        
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
          {parsedEvents.map((event) => {
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

            return (
              <div
                key={event.id}
                className={`absolute left-1 right-1 bg-blue-100 border border-blue-200 p-2 overflow-hidden
                  ${event.continuesFromPrevDay ? 'border-t-2 border-t-blue-400' : 'rounded-t-lg'}
                  ${event.continuesNextDay ? 'border-b-2 border-b-blue-400' : 'rounded-b-lg'}`}
                style={{
                  top: `${topPosition}px`,
                  height: `${heightPixels}px`,
                  minHeight: '20px'
                }}
              >
                <div className="text-sm font-semibold text-blue-800 truncate">
                  {event.title}
                  {(event.continuesFromPrevDay || event.continuesNextDay) && ' (...)'}
                </div>
                {heightPixels >= 8 && event.location && (
                  <div className="text-xs text-blue-600 truncate">
                    {event.location}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
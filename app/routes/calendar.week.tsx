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
import { useLoading } from '~/contexts/LoadingContext';

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
  let isCached = false;

  if (calendarId) {
    // Check cache first before setting loading state
    const cachedEvents = getCachedEvents(calendarId);
    isCached = Array.isArray(cachedEvents) && cachedEvents.length > 0;
    
    if (isCached) {
      events = cachedEvents as CalendarEvent[];
      isLoading = false;
    } else {
      isLoading = true;
      try {
        const calendar = await db.query.calendar.findFirst({
          where: (calendar, { eq }) => eq(calendar.id, calendarId)
        });

        if (calendar) {
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
    timestamp: Date.now(),
    isCached
  });
}

export default function CalendarWeek() {
  const { events: initialEvents, isLoading: isDataLoading } = useLoaderData<typeof loader>();
  const { currentDate, visibleCalendars } = useOutletContext<ContextType>();
  const navigation = useNavigation();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState(initialEvents);
  const [favorites, setFavorites] = useState<Calendar[]>([]);
  const { showLoading, hideLoading } = useLoading();

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

        // Determine if it's an all-day event
        const isAllDay = 
          (startTime.getHours() === 0 && startTime.getMinutes() === 0 &&
           endTime.getHours() === 23 && endTime.getMinutes() === 59) ||
          (endTime.getTime() - startTime.getTime() >= 24 * 60 * 60 * 1000); // Events 24h or longer

        // Calculate event span for all-day events
        const eventStartDay = startOfDay(startTime);
        const eventEndDay = startOfDay(endTime); // Change to startOfDay since iCal end date is exclusive
        const weekStartDay = startOfDay(weekStart);
        const weekEndDay = endOfDay(weekEnd);

        // Adjust start and end times to week boundaries for all-day events
        const adjustedStartTime = isAllDay ? 
          new Date(Math.max(eventStartDay.getTime(), weekStartDay.getTime())) : 
          startTime;
        const adjustedEndTime = isAllDay ? 
          new Date(Math.min(eventEndDay.getTime() - 1, weekEndDay.getTime())) : // Subtract 1ms to make it end at previous day
          endTime;

        // Create unique ID for deduplication
        const uniqueId = isAllDay
          ? `${event.id}_${startTime.toISOString().split('T')[0]}_fullday`
          : event.recurrenceId 
            ? `${event.id}_${event.recurrenceId}`
            : `${event.id}_${startTime.toISOString()}`;

        return {
          ...event,
          startTime: adjustedStartTime,
          endTime: adjustedEndTime,
          isAllDay,
          originalStart: startTime,
          originalEnd: new Date(endTime.getTime() - (isAllDay ? 24 * 60 * 60 * 1000 : 0)), // Adjust original end for full-day events
          uniqueId
        };
      } catch (error) {
        console.error('Error parsing event dates:', error, event);
        return null;
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  // Deduplicate events using Map
  const processedMap = new Map<string, typeof weekEvents[0]>();
  weekEvents.forEach(event => {
    if (!processedMap.has(event.uniqueId) || 
        // For recurring events, prefer the instance with recurrenceId
        (event.recurrenceId && !processedMap.get(event.uniqueId)?.recurrenceId)) {
      processedMap.set(event.uniqueId, event);
    }
  });
  const deduplicatedEvents = Array.from(processedMap.values());

  // Separate all-day events from regular events
  const allDayEvents = deduplicatedEvents.filter(event => event.isAllDay);
  const regularEvents = deduplicatedEvents.filter(event => !event.isAllDay);

  // Group all-day events by their vertical position to prevent overlaps
  const groupAllDayEvents = (events: typeof allDayEvents) => {
    const groups: typeof allDayEvents[] = [];
    
    events.forEach(event => {
      // Find the first group where this event can fit
      const group = groups.find(group => 
        !group.some(existingEvent => {
          const eventStart = event.startTime.getTime();
          const eventEnd = event.endTime.getTime();
          const existingStart = existingEvent.startTime.getTime();
          const existingEnd = existingEvent.endTime.getTime();
          
          return (eventStart <= existingEnd && eventEnd >= existingStart);
        })
      );

      if (group) {
        group.push(event);
      } else {
        groups.push([event]);
      }
    });

    return groups;
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
    <div className="relative h-full">
      <div className="flex flex-col h-full bg-white">
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

        {/* Main Grid Container */}
        <div className="flex flex-1 relative">
          {/* Left Gutter */}
          <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-white">
            {/* All Day Label */}
            <div className="p-2">
              <span className="text-xs text-gray-500">All Day</span>
            </div>
            
            {/* Time Labels */}
            <div className="sticky left-0">
              {timeSlots.map(({ label, hour }, index) => (
                <div key={index} className="h-12 relative">
                  <div className="absolute top-6 right-2 flex items-center h-3">
                    <span className="text-xs text-gray-500 pr-2">{label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column Structure - Shared between All Day and Time Grid */}
          <div className="flex flex-1">
            {weekDates.map((date, dateIndex) => (
              <div key={dateIndex} className="flex-1 relative">
                {/* Column Border */}
                <div className="absolute inset-0 border-r border-gray-200" />

                {/* All Day Events Container */}
                <div className="relative">
                  {(() => {
                    const eventGroups = groupAllDayEvents(filterEvents(allDayEvents));
                    const totalHeight = Math.max(eventGroups.length * 28, 28);
                    
                    return (
                      <div className="border-b border-gray-200" style={{ height: `${totalHeight}px` }}>
                        {eventGroups.map((group, groupIndex) => (
                          <div key={groupIndex} className="absolute w-full" style={{ top: `${groupIndex * 28}px` }}>
                            {group.filter(event => {
                              const dayStart = startOfDay(date);
                              const dayEnd = endOfDay(date);
                              const eventStart = event.startTime.getTime();
                              const eventEnd = event.endTime.getTime();
                              return eventStart <= dayEnd.getTime() && eventEnd >= dayStart.getTime();
                            }).map(event => {
                              const dayStart = startOfDay(date);
                              const dayEnd = endOfDay(date);
                              const continuesBefore = event.originalStart < dayStart;
                              const continuesAfter = event.originalEnd > dayEnd;
                              
                              return (
                                <div
                                  key={event.id}
                                  className={`absolute left-0 right-0 mx-1 p-1 cursor-pointer ${
                                    continuesBefore ? 'rounded-l-none' : 'rounded-l'
                                  } ${
                                    continuesAfter ? 'rounded-r-none' : 'rounded-r'
                                  }`}
                                  style={{
                                    backgroundColor: event.color ? `${event.color}20` : '#3b82f620',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: event.color || '#3b82f6',
                                    borderLeftWidth: continuesBefore ? '0' : '1px',
                                    borderRightWidth: continuesAfter ? '0' : '1px'
                                  }}
                                  onClick={() => setSelectedEvent(event)}
                                >
                                  <div 
                                    className="text-sm font-semibold truncate" 
                                    style={{ color: event.color || '#3b82f6' }}
                                  >
                                    {event.title}
                                    {(continuesBefore || continuesAfter) && ' ...'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Time Grid */}
                <div className="relative">
                  {/* Hour lines */}
                  {timeSlots.map((_, index) => (
                    <div
                      key={index}
                      className="h-12 border-b border-gray-100"
                    />
                  ))}

                  {/* Current time indicator */}
                  {formatColumnHeader(date).isToday && <CurrentTimeIndicator />}

                  {/* Regular Events */}
                  {filterEvents(regularEvents)
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
    </div>
  );
} 

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext } from "@remix-run/react";
import { db } from "~/utils/db.server";

interface Event {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  calendarId: string;
}

type ContextType = {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const currentDate = dateParam ? new Date(dateParam) : new Date();

  // TODO: Fetch events for the day from the database
  const events: Event[] = [];

  return json({ currentDate: currentDate.toISOString(), events });
}

export default function CalendarDay() {
  const { events } = useLoaderData<typeof loader>();
  const { currentDate } = useOutletContext<ContextType>();

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
              className="h-12 text-right pr-2 relative"
            >
              <span className="text-xs text-gray-500 absolute -top-2 right-2">{label}</span>
            </div>
          ))}
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

          {/* Current time indicator */}
          {isToday && (
            <div
              className="absolute left-0 right-0 flex items-center"
              style={{
                top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 1440 * 100}%`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.25" />
              <div className="flex-1 border-t border-red-500" />
            </div>
          )}

          {/* Events would be rendered here */}
        </div>
      </div>
    </div>
  );
} 
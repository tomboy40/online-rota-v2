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

  // TODO: Fetch events for the month from the database
  const events: Event[] = [];

  return json({ currentDate: currentDate.toISOString(), events });
}

export default function CalendarMonth() {
  const { events } = useLoaderData<typeof loader>();
  const { currentDate } = useOutletContext<ContextType>();

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
    <div className="flex flex-col h-full bg-white p-4">
      {/* Month Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day headers */}
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className="bg-white p-2">
            <span className="text-sm font-medium text-gray-500">{day}</span>
          </div>
        ))}

        {/* Calendar dates */}
        {generateMonthDates().map((date, index) => (
          <div
            key={index}
            className="bg-white min-h-[120px] p-2 relative"
          >
            {date && (
              <>
                <span className={`text-sm ${
                  isToday(date) 
                    ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                    : 'text-gray-900'
                }`}>
                  {date.getDate()}
                </span>
                {/* Events would be rendered here */}
                <div className="mt-1 space-y-1">
                  {events
                    .filter(event => {
                      const eventDate = new Date(event.startTime);
                      return eventDate.toDateString() === date.toDateString();
                    })
                    .map(event => (
                      <div
                        key={event.id}
                        className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1 truncate"
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